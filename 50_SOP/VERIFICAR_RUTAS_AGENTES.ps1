param(
    [string]$SourceRoot = 'C:\DEPARTAMENTO MODOZAINT',
    [string]$EvidenceRoot = (Join-Path $PSScriptRoot '..\60_CONOCIMIENTO\EVIDENCIA')
)

$ErrorActionPreference = 'Stop'
$v2Root = Split-Path -Parent $PSScriptRoot
$agentsRoot = Join-Path $v2Root '70_AGENTES'
$agentNames = @(
    'ORQUESTADOR', 'XIOMARA', 'JUANJO', 'CONTENIDO', 'COPY',
    'VIDEO', 'HOY', 'DERMATINTA', 'KAIZEN', 'MODOZAINT'
)

$missingEntries = @()
foreach ($name in $agentNames) {
    $entry = Join-Path $agentsRoot ($name + '\00_ENTRAR.md')
    if (-not (Test-Path -LiteralPath $entry -PathType Leaf)) {
        $missingEntries += $entry
    }
}

$requiredPolicyFiles = @(
    '00_NORTE/FUENTES_CANONICAS.md',
    '00_NORTE/PROPIEDAD_DE_RUTAS.md',
    '00_NORTE/DECISIONES/ADR_0001_ARQUITECTURA_MULTIAGENTE.md',
    '20_OPERACION/TAREAS/README.md',
    '20_OPERACION/TAREAS/TASK_2026_08_29_MIGRACION_AGENTES.md',
    '30_RESULTADOS/METRICAS_AGENTES.md',
    '50_SOP/TAREA_Y_HANDOFF.md',
    '50_SOP/PRESUPUESTO_Y_EFICIENCIA.md',
    '60_CONOCIMIENTO/DECISIONES_MULTIAGENTE.md'
)
$missingPolicyFiles = @()
$policyFiles = @()
foreach ($relative in $requiredPolicyFiles) {
    $path = Join-Path $v2Root $relative
    if (Test-Path -LiteralPath $path -PathType Leaf) {
        $policyFiles += Get-Item -LiteralPath $path
    }
    else {
        $missingPolicyFiles += $path
    }
}

$evidenceManifest = @{
    'ARQUITECTURA_MULTIAGENTE_2026_08_29.md' = '78A3C43B699F6D122AF97DC07B89BDB548971E280019B82B96B6592462113DE6'
    'EFICIENCIA_COSTO_MULTIAGENTE_2026_08_29.md' = '822BAFF4EECC1A8094F15482D1025FD3C8ED833F41A5897BAD4D76D36776EFC2'
}
$missingEvidenceFiles = @()
$evidenceHashMismatches = @()
foreach ($name in $evidenceManifest.Keys) {
    $path = Join-Path $EvidenceRoot $name
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $missingEvidenceFiles += $path
        continue
    }
    $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash
    if ($actualHash -ne $evidenceManifest[$name]) {
        $evidenceHashMismatches += [pscustomobject]@{
            File = $path
            Expected = $evidenceManifest[$name]
            Actual = $actualHash
        }
    }
}

$legacyRefs = @()
$missingRefs = @()
$verifiedRefs = New-Object System.Collections.Generic.HashSet[string]
$templateRefs = New-Object System.Collections.Generic.HashSet[string]
$markdownFiles = @(Get-ChildItem -LiteralPath $agentsRoot -Filter '*.md' -File -Recurse) + $policyFiles

foreach ($file in $markdownFiles) {
    $text = [IO.File]::ReadAllText($file.FullName)

    foreach ($legacy in [regex]::Matches($text, '(?<!70_)AGENTES/[A-Za-z0-9_<>.-]+')) {
        $legacyRefs += [pscustomobject]@{ File = $file.FullName; Reference = $legacy.Value }
    }

    foreach ($match in [regex]::Matches($text, '`([^`\r\n]+)`')) {
        $reference = $match.Groups[1].Value.Trim()
        if ($reference -match '[<>*]' -or $reference -match 'AAAA[-_]MM(?:[-_]DD)?') {
            [void]$templateRefs.Add($reference)
            continue
        }

        $candidate = $null
        if ($reference -match '^SOURCE_ROOT/(.+)$') {
            $candidate = Join-Path $SourceRoot $Matches[1]
        }
        elseif ($reference -match '^EVIDENCE_ROOT/(.+)$') {
            $candidate = Join-Path $EvidenceRoot $Matches[1]
        }
        elseif ($reference -match '^(70_AGENTES|00_NORTE|20_OPERACION|60_CONOCIMIENTO|50_SOP)/') {
            $candidate = Join-Path $v2Root $reference
        }
        elseif ($reference -match '^(BRANDS|KNOWLEDGE_PACKS|CONTENIDO|VIDEOTECA|SISTEMA|_HANDOFFS|_MIGRACION)/') {
            $candidate = Join-Path $SourceRoot $reference
        }
        elseif ($reference -in @('_USO_LOG.md', '05_CURRENT_PRIORITIES.md')) {
            $candidate = Join-Path $SourceRoot $reference
        }

        if ($null -eq $candidate) {
            continue
        }

        $candidate = $candidate.Replace('/', '\')
        if (Test-Path -LiteralPath $candidate) {
            [void]$verifiedRefs.Add($candidate)
        }
        else {
            $missingRefs += [pscustomobject]@{ File = $file.FullName; Reference = $reference; Resolved = $candidate }
        }
    }
}

$result = [pscustomobject]@{
    Agents = $agentNames.Count
    EntryFilesVerified = $agentNames.Count - $missingEntries.Count
    DeclaredPathsVerified = $verifiedRefs.Count
    TemplatePathsSkipped = $templateRefs.Count
    MissingEntryFiles = $missingEntries
    PolicyFilesVerified = $requiredPolicyFiles.Count - $missingPolicyFiles.Count
    EvidenceFilesVerified = $evidenceManifest.Count - $missingEvidenceFiles.Count - $evidenceHashMismatches.Count
    MissingPolicyFiles = $missingPolicyFiles
    MissingEvidenceFiles = $missingEvidenceFiles
    EvidenceHashMismatches = $evidenceHashMismatches
    LegacyAgentReferences = $legacyRefs
    MissingDeclaredPaths = $missingRefs
}

$result | ConvertTo-Json -Depth 6

if (
    $missingEntries.Count -gt 0 -or
    $missingPolicyFiles.Count -gt 0 -or
    $missingEvidenceFiles.Count -gt 0 -or
    $evidenceHashMismatches.Count -gt 0 -or
    $legacyRefs.Count -gt 0 -or
    $missingRefs.Count -gt 0
) {
    exit 1
}
