export type MarketingInfoSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type MarketingInfoPageKey = 'privacy' | 'terms' | 'security' | 'support';

export type MarketingInfoPageContent = {
  key: MarketingInfoPageKey;
  title: string;
  description: string;
  updatedLabel: string;
  sections: MarketingInfoSection[];
};

/** Contenido genérico de referencia (no constituye asesoría legal). */
export const MARKETING_INFO_PAGES: Record<MarketingInfoPageKey, MarketingInfoPageContent> = {
  privacy: {
    key: 'privacy',
    title: 'Privacidad',
    description:
      'Esta política describe, de forma general, cómo TerminalOps y Axolotl Technology pueden tratar información personal relacionada con el sitio y el servicio.',
    updatedLabel: 'Última actualización: agosto 2026',
    sections: [
      {
        heading: '1. Alcance',
        paragraphs: [
          'Esta Política de Privacidad aplica al sitio web informativo de TerminalOps y, en términos generales, al uso de la plataforma cuando se recopilan datos de contacto, cuenta o soporte.',
          'El tratamiento específico de datos de clientes finales de tu empresa puede regirse además por acuerdos comerciales, un DPA (cuando aplique) y la configuración de tu organización.',
        ],
      },
      {
        heading: '2. Información que podemos recopilar',
        paragraphs: [
          'Dependiendo de cómo interactúes con nosotros, podemos procesar categorías como:',
        ],
        bullets: [
          'Datos de contacto (nombre, correo, empresa y teléfono) cuando solicitas información o soporte.',
          'Datos de cuenta (identificadores de usuario, rol y preferencias) si usas la plataforma.',
          'Datos técnicos (dirección IP, tipo de navegador, dispositivo y registros de acceso) para seguridad y operación del servicio.',
          'Contenido que envíes voluntariamente en formularios, tickets de soporte o comunicaciones.',
        ],
      },
      {
        heading: '3. Para qué usamos la información',
        paragraphs: ['Usamos la información para fines legítimos de negocio, entre ellos:'],
        bullets: [
          'Proveer, mantener y mejorar TerminalOps.',
          'Autenticar usuarios, prevenir abusos y proteger la seguridad del servicio.',
          'Responder solicitudes de soporte y comunicaciones comerciales cuando corresponda.',
          'Cumplir obligaciones legales y requerimientos regulatorios aplicables.',
        ],
      },
      {
        heading: '4. Compartición de información',
        paragraphs: [
          'No vendemos datos personales. Podemos compartir información con proveedores que nos ayudan a operar el servicio (por ejemplo, hosting, correo o herramientas de soporte), bajo obligaciones de confidencialidad y solo en la medida necesaria.',
          'También podemos divulgar información si la ley lo exige o para proteger derechos, seguridad e integridad del servicio y de sus usuarios.',
        ],
      },
      {
        heading: '5. Conservación y seguridad',
        paragraphs: [
          'Conservamos la información durante el tiempo necesario para los fines descritos o según lo exija la ley. Aplicamos medidas técnicas y organizativas razonables para proteger los datos frente a acceso no autorizado, pérdida o alteración.',
          'Ningún sistema es 100% seguro; te recomendamos usar contraseñas sólidas y proteger el acceso a tu cuenta.',
        ],
      },
      {
        heading: '6. Derechos y contacto',
        paragraphs: [
          'Según la legislación aplicable, puedes solicitar acceso, corrección, actualización o eliminación de ciertos datos personales, o limitar ciertos tratamientos.',
          'Para ejercer derechos o hacer preguntas sobre privacidad, contacta a Axolotl Technology a través de los canales de soporte publicados en esta página.',
        ],
      },
    ],
  },
  terms: {
    key: 'terms',
    title: 'Términos',
    description:
      'Estos Términos de Servicio establecen condiciones generales de uso del sitio y de la plataforma TerminalOps. Son un marco de referencia y pueden complementar acuerdos específicos con tu organización.',
    updatedLabel: 'Última actualización: agosto 2026',
    sections: [
      {
        heading: '1. Aceptación',
        paragraphs: [
          'Al acceder al sitio o utilizar TerminalOps, aceptas estos Términos. Si no estás de acuerdo, no uses el servicio.',
          'Si usas TerminalOps en nombre de una empresa, declaras tener autoridad para vincular a esa organización.',
        ],
      },
      {
        heading: '2. Descripción del servicio',
        paragraphs: [
          'TerminalOps es una plataforma de software para apoyo a operaciones logísticas (por ejemplo, flota, operadores, costos, clientes y reportes). Las funciones disponibles pueden variar según el plan, permisos y configuración de tu cuenta.',
        ],
      },
      {
        heading: '3. Cuentas y responsabilidades',
        paragraphs: ['Eres responsable de:'],
        bullets: [
          'Mantener la confidencialidad de tus credenciales.',
          'La exactitud de la información que capturas en la plataforma.',
          'El uso del servicio conforme a la ley y a políticas internas de tu organización.',
          'Notificarnos de forma razonable ante usos no autorizados de tu cuenta.',
        ],
      },
      {
        heading: '4. Uso aceptable',
        paragraphs: ['No debes, entre otras conductas:'],
        bullets: [
          'Intentar acceder sin autorización a sistemas, datos o cuentas ajenas.',
          'Interferir con la operación, seguridad o disponibilidad del servicio.',
          'Usar TerminalOps para actividades ilícitas o para infringir derechos de terceros.',
          'Realizar ingeniería inversa indebida, salvo cuando la ley lo permita expresamente.',
        ],
      },
      {
        heading: '5. Suscripción, cambios y suspensión',
        paragraphs: [
          'El acceso puede estar sujeto a planes, periodos de prueba o acuerdos comerciales. Podemos modificar funciones, límites o precios con aviso razonable cuando corresponda.',
          'Podemos suspender o restringir el acceso ante incumplimiento material de estos Términos, riesgos de seguridad o requerimientos legales.',
        ],
      },
      {
        heading: '6. Propiedad intelectual',
        paragraphs: [
          'TerminalOps, su marca, software e interfaces son propiedad de Axolotl Technology o de sus licenciantes. Se otorga una licencia limitada, no exclusiva e intransferible para usar el servicio según tu plan, sin transferir titularidad.',
        ],
      },
      {
        heading: '7. Limitación de responsabilidad',
        paragraphs: [
          'En la máxima medida permitida por la ley, el servicio se ofrece “tal cual” y “según disponibilidad”. Axolotl Technology no garantiza operación ininterrumpida ni resultados específicos de negocio.',
          'Salvo dolo o lo que la ley no permita limitar, la responsabilidad agregada se limitará a lo efectivamente pagado por el servicio en el periodo reciente aplicable al reclamo.',
        ],
      },
      {
        heading: '8. Contacto',
        paragraphs: [
          'Para dudas sobre estos Términos, utiliza los canales de soporte o contacto comercial publicados en TerminalOps.',
        ],
      },
    ],
  },
  security: {
    key: 'security',
    title: 'Seguridad',
    description:
      'Resumen general de nuestro enfoque de seguridad. Está pensado para comunicar controles comunes en plataformas SaaS; los detalles contractuales o de auditoría pueden compartirse bajo acuerdo cuando aplique.',
    updatedLabel: 'Última actualización: agosto 2026',
    sections: [
      {
        heading: '1. Postura general',
        paragraphs: [
          'Protegemos la confidencialidad, integridad y disponibilidad de la información mediante controles técnicos y procesos operativos. El objetivo es reducir riesgos sin comprometer la operación diaria de tu terminal.',
        ],
      },
      {
        heading: '2. Controles técnicos',
        paragraphs: ['De forma general, nuestro enfoque incluye:'],
        bullets: [
          'Cifrado en tránsito (TLS) para comunicaciones entre cliente y servicio.',
          'Controles de acceso basados en roles y principio de mínimo privilegio.',
          'Autenticación de usuarios y protección de sesiones.',
          'Registro de eventos relevantes para soporte, auditoría y detección de anomalías.',
          'Respaldos y prácticas de recuperación orientadas a continuidad del servicio.',
        ],
      },
      {
        heading: '3. Datos y evidencia operativa',
        paragraphs: [
          'TerminalOps permite organizar documentos y evidencias asociadas a la operación. El acceso a esa información depende de permisos configurados por tu organización, de modo que cada persona vea solo lo necesario.',
          'Te recomendamos definir políticas internas de retención, clasificación y compartición con clientes.',
        ],
      },
      {
        heading: '4. Proveedores y entorno',
        paragraphs: [
          'Podemos apoyarnos en proveedores de infraestructura y servicios auxiliares. Seleccionamos y supervisamos proveedores con criterios de seguridad razonables para el tipo de servicio.',
        ],
      },
      {
        heading: '5. Gestión de incidentes',
        paragraphs: [
          'Contamos con un proceso para evaluar y responder incidentes de seguridad. Cuando un evento pueda afectar materialmente a clientes, buscaremos comunicar lo relevante de forma oportuna y conforme a obligaciones aplicables.',
        ],
      },
      {
        heading: '6. Divulgación responsable',
        paragraphs: [
          'Si identificas una vulnerabilidad, te pedimos reportarla de forma responsable a través de soporte, sin explotar el hallazgo ni acceder a datos ajenos. Investigaremos reportes de buena fe y priorizaremos remediaciones según impacto.',
        ],
      },
      {
        heading: '7. Solicitud de información',
        paragraphs: [
          'Para cuestionarios de seguridad, DPA u otra documentación, contacta a nuestro equipo. Parte del material puede requerir NDA o validación de relación comercial.',
        ],
      },
    ],
  },
  support: {
    key: 'support',
    title: 'Soporte',
    description:
      'Canales y lineamientos generales de ayuda para usuarios de TerminalOps. Los tiempos y alcances exactos pueden variar según tu plan o acuerdo.',
    updatedLabel: 'Última actualización: agosto 2026',
    sections: [
      {
        heading: '1. Cómo podemos ayudarte',
        paragraphs: ['El equipo de soporte puede asistirte con:'],
        bullets: [
          'Acceso a cuenta, restablecimiento de contraseña y problemas de inicio de sesión.',
          'Dudas de uso sobre módulos principales (flota, viajes, gastos, clientes, reportes).',
          'Incidencias técnicas que impidan operar la plataforma.',
          'Orientación para contactar ventas o solicitar ampliación de plan.',
        ],
      },
      {
        heading: '2. Antes de contactarnos',
        paragraphs: ['Para agilizar la atención, ten a la mano:'],
        bullets: [
          'Correo de la cuenta afectada y nombre de la empresa.',
          'Descripción clara del problema y pasos para reproducirlo.',
          'Capturas, hora aproximada del incidente y navegador/dispositivo.',
          'Mensaje de error exacto, si aparece.',
        ],
      },
      {
        heading: '3. Canales de contacto',
        paragraphs: [
          'Puedes solicitar ayuda desde los canales oficiales publicados por Axolotl Technology / TerminalOps (correo de soporte o formulario de contacto comercial).',
          'Para temas urgentes de seguridad, indícalo explícitamente en el asunto del mensaje.',
        ],
      },
      {
        heading: '4. Tiempos de respuesta',
        paragraphs: [
          'Buscamos responder en horarios hábiles con la mayor prontitud posible. La prioridad se define por impacto operativo (por ejemplo, imposibilidad de acceso frente a consultas generales).',
          'Los acuerdos de nivel de servicio (SLA), si existen, se detallan en tu contrato o plan.',
        ],
      },
      {
        heading: '5. Alcance y limitaciones',
        paragraphs: [
          'El soporte estándar cubre la plataforma TerminalOps. No incluye, de forma general, consultoría de procesos internos de tu empresa, desarrollo a la medida no contratado, ni soporte de sistemas de terceros ajenos a nuestro servicio.',
        ],
      },
      {
        heading: '6. Estado del servicio',
        paragraphs: [
          'Si experimentas una interrupción general, verifica conectividad local y vuelve a intentar. Ante caídas confirmadas, comunicaremos actualizaciones por los canales disponibles.',
        ],
      },
    ],
  },
};

export const MARKETING_INFO_PATH_TO_KEY: Record<string, MarketingInfoPageKey> = {
  privacidad: 'privacy',
  terminos: 'terms',
  seguridad: 'security',
  soporte: 'support',
};
