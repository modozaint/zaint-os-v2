-- =============================================================
-- 007 · TU DIAGNÓSTICO — lo que salió de las llamadas de asesoría
--
-- La tercera pieza para dejar Parcero. Aquí no hay cálculo: es el contenido
-- del informe del asesor, que se escribió una vez y se relee muchas.
-- Fuente: "Informe-Santiago-Giraldo-14-de-agosto-de-2026.pdf" (asesoría del
-- 30 de junio de 2026).
-- =============================================================

create table if not exists diagnostico (
  id                      bigserial primary key,
  usuario_id              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha_asesoria          date,
  te_entra                numeric(14,2),
  te_sale                 numeric(14,2),
  diferencia              numeric(14,2),
  capacidad_ahorro        text,
  nivel_endeudamiento     numeric(5,2),
  gastos_fijos_pct        numeric(5,2),
  capacidad_endeudamiento numeric(14,2),
  creias                  text,   -- lo que creías vs. la realidad
  mini_plan               text,   -- para empezar ya
  plan_fondo              text,   -- el cambio de fondo
  mensaje                 text,   -- el mensaje personalizado del cierre
  unique (usuario_id)
);

/** Los bloques narrativos: el perfil y las recomendaciones. */
create table if not exists diagnostico_bloques (
  id         bigserial primary key,
  usuario_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo       text not null check (tipo in ('perfil', 'recomendacion')),
  titulo     text not null,
  cuerpo     text not null,
  orden      int not null default 0
);

do $$
declare t text;
begin
  foreach t in array array['diagnostico','diagnostico_bloques']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "propias_select" on %I', t);
    execute format('drop policy if exists "propias_insert" on %I', t);
    execute format('drop policy if exists "propias_update" on %I', t);
    execute format('drop policy if exists "propias_delete" on %I', t);
    execute format('create policy "propias_select" on %I for select to authenticated using (usuario_id = auth.uid())', t);
    execute format('create policy "propias_insert" on %I for insert to authenticated with check (usuario_id = auth.uid())', t);
    execute format('create policy "propias_update" on %I for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid())', t);
    execute format('create policy "propias_delete" on %I for delete to authenticated using (usuario_id = auth.uid())', t);
  end loop;
end $$;

-- ---------- El diagnóstico real de Santiago ----------
do $$
declare yo uuid;
begin
  select id into yo from auth.users
  where lower(email) in ('kayzenlanas@gmail.com', 'santiagojg0909@gmail.com')
  order by created_at limit 1;

  if yo is null then
    raise notice 'Entra a la app primero: todavia no existe la cuenta de Santiago.';
    return;
  end if;
  if exists (select 1 from diagnostico where usuario_id = yo) then
    raise notice 'El diagnostico ya estaba cargado. No se toca nada.';
    return;
  end if;

  insert into diagnostico (
    usuario_id, fecha_asesoria, te_entra, te_sale, diferencia,
    capacidad_ahorro, nivel_endeudamiento, gastos_fijos_pct, capacidad_endeudamiento,
    creias, mini_plan, plan_fondo, mensaje
  ) values (
    yo, '2026-06-30', 2219333, 1332050, 887283,
    'Alta', 17, 43, 665800,
    'Santiago, estimaste un ingreso de 2.5 millones, deudas de 400 mil y gastos fijos de 500 mil, sintiendo que «pasabas al ras» a fin de mes. Sin embargo, la realidad de tu presupuesto muestra un ingreso mensual de 2.22 millones, con pagos de deudas de 373 mil y gastos fijos que representan un 43% de tus ingresos, lo que es significativamente más alto de lo que percibías. A pesar de esto, tienes una diferencia positiva de 887 mil pesos mensuales. Esta brecha entre tu percepción y la realidad es clave para entender por qué sientes ansiedad y la falta de control, ya que no tienes claridad sobre dónde se va ese excedente.',
    'En el corto plazo, tu prioridad es establecer un presupuesto claro y empezar a registrar cada uno de tus gastos, incluso los más pequeños. Luego, separa tus finanzas personales de las de tus emprendimientos abriendo cuentas bancarias distintas para cada una. Con el excedente mensual de 887 mil pesos, comienza a construir un fondo de emergencia de al menos 3 meses de tus gastos fijos (aproximadamente 2.86 millones de pesos), depositando un monto fijo cada mes.',
    'A mediano y largo plazo, la acción estructural clave es formalizar la gestión financiera de tus emprendimientos, estableciendo proyecciones y metas de rentabilidad claras. Una vez que tu fondo de emergencia esté sólido y tus deudas con 0% de interés estén bajo control, podrás reinvertir estratégicamente en tus negocios y explorar opciones de inversión que se alineen con tu perfil de riesgo, siempre buscando la escalabilidad y la construcción de un patrimonio que te permita la libertad financiera deseada.',
    'Santiago, tienes una energía y una visión emprendedora impresionantes. Es normal sentir ansiedad cuando las finanzas no tienen un rumbo claro, pero el hecho de que estés aquí buscando orden es la prueba de tu compromiso. Recuerda que cada pequeño paso que des hoy, cada gasto que registres, cada peso que ahorres, te acerca a esa independencia que tanto anhelas. Confía en tu capacidad para aprender y adaptarte, y verás cómo tus sueños se materializan con disciplina y estrategia.'
  );

  insert into diagnostico_bloques (usuario_id, tipo, titulo, cuerpo, orden) values
    (yo, 'perfil', 'Cómo te ves con tu plata',
     'Santiago, tu perfil revela una persona joven y muy motivada por la independencia y el emprendimiento, impulsado por tus experiencias familiares. Sin embargo, esta ambición se ve frenada por la ansiedad y la desorganización financiera. Reconoces la necesidad de cambio y estás dispuesto a aprender, lo cual es fundamental para transformar tu impulsividad en una gestión estructurada que te permita alcanzar tus metas de libertad financiera.', 1),
    (yo, 'perfil', 'Tus deudas',
     'Actualmente, tienes dos deudas principales: un refinanciamiento con Confiar y un crédito de moto con una conocida. Es positivo que ninguna de estas deudas se encuentre en mora, lo que te da un buen punto de partida para gestionarlas proactivamente y buscar saldarlas más rápido, como es tu deseo.', 2),
    (yo, 'perfil', 'Tu presupuesto',
     'Admites que no llevas un control de tu presupuesto. Esta falta de seguimiento es la raíz de la incertidumbre y la ansiedad que sientes, ya que no sabes con exactitud a dónde va tu dinero cada mes.', 3),
    (yo, 'perfil', 'Tus hábitos',
     'Tus hábitos de gasto se caracterizan por la impulsividad y los «pequeños antojos». Aunque parezcan insignificantes, estos gastos no planificados pueden sumar una cantidad considerable y ser un obstáculo para tus metas de ahorro y emprendimiento.', 4),
    (yo, 'perfil', 'Tu meta principal',
     'Tu meta principal a corto plazo es salirte de tu trabajo actual para dedicarte plenamente a tus emprendimientos, buscando la independencia laboral y financiera.', 5),
    (yo, 'perfil', 'Decisiones cerca',
     'Estás contemplando varias decisiones importantes: empezar a invertir, cambiar de empleo (relacionado con tu meta principal), generar nuevas fuentes de ingresos, emprender (lo cual ya haces) y, fundamentalmente, empezar a ahorrar con constancia.', 6),

    (yo, 'recomendacion', 'Desarrolla tus habilidades sociales',
     'Cultivar tus habilidades de comunicación y relacionamiento, posiblemente a través de la lectura de libros como «Cómo ganar amigos e influir sobre las personas», te será de gran utilidad. Esto no solo te ayudará a superar la timidez, sino que también es crucial para tus emprendimientos y para establecer conexiones valiosas.', 1),
    (yo, 'recomendacion', 'Enfoca tus esfuerzos emprendedores',
     'Estás explorando múltiples ideas de negocio, lo cual es admirable. Sin embargo, es vital que analices y proyectes cuáles de tus emprendimientos tienen la mayor probabilidad de crecimiento y rentabilidad. Prioriza tus energías en aquellos con mayor potencial para ver resultados concretos.', 2),
    (yo, 'recomendacion', 'Revisa los descuentos de nómina',
     'Es urgente que revises y corrijas cualquier descuento en tu nómina que no sea claro o que no corresponda. Entender cada deducción te dará mayor control sobre tus ingresos y evitará fugas de dinero innecesarias.', 3),
    (yo, 'recomendacion', 'Entiende el valor de tu empleo actual',
     'Aunque tu meta sea dejar tu trabajo, es fundamental que comprendas que, por ahora, tu empleo es tu principal fuente de ingresos y el soporte de tus emprendimientos. No tiene que gustarte, pero sí debes verlo como una herramienta estratégica que te permite construir las bases para tu futuro. Aprovecha este tiempo para capitalizarte.', 4),
    (yo, 'recomendacion', 'Estructura tu camino emprendedor',
     'Para lograr tu independencia, el orden es clave. Primero, enfócate en llenar tu agenda con actividades que generen ingresos para tus emprendimientos. Luego, trabaja para garantizar un «salario mínimo viable» que cubra tus necesidades básicas antes de considerar renunciar a tu empleo. Organiza tus finanzas empresariales y personales para tener claridad sobre la rentabilidad de cada proyecto.', 5),
    (yo, 'recomendacion', 'Genera ingresos antes de invertir',
     'Antes de lanzarte a invertir, concéntrate en generar ingresos consistentes y sólidos con tus emprendimientos. La fase inicial debe ser de «generar al fallo», es decir, probar y ajustar estrategias hasta que encuentres lo que realmente funciona y produce ganancias estables.', 6),
    (yo, 'recomendacion', 'Aplica el costo de oportunidad',
     'Cada decisión de gasto o inversión implica renunciar a otra. Antes de realizar una compra, pregúntate si ese dinero podría ser mejor utilizado para tus metas más grandes, como salir de deudas, construir tu fondo de emergencia o invertir en tus emprendimientos. Entender esto te ayudará a tomar decisiones más conscientes y estratégicas.', 7);

  raise notice 'Diagnostico cargado: 6 bloques de perfil y 7 recomendaciones.';
end $$;
