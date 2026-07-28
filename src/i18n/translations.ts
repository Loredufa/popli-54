export type AppLocale = 'es' | 'en' | 'pt' | 'ja';

export type TranslationKeys = {
  // Settings screen
  settings_title: string;
  settings_voices_title: string;
  settings_app_language_title: string;
  settings_loading_voices: string;
  settings_version: string;
  settings_change_password: string;
  settings_listen_demo: string;
  settings_playing: string;
  // Maker screen — card/section titles
  maker_customization_title: string;
  maker_your_story_title: string;
  // Maker — form labels
  maker_central_theme_label: string;
  maker_central_theme_placeholder: string;
  maker_skill_label: string;
  maker_characters_label: string;
  maker_characters_placeholder: string;
  maker_duration_label: string;
  maker_story_language_label: string;
  maker_category_label: string;
  maker_genre_label: string;
  // Age chips
  age_2_5: string;
  age_6_10: string;
  // Category chips
  category_disparatado: string;
  category_literario: string;
  category_rimas: string;
  // Genre chips (6-10)
  genre_misterio: string;
  genre_amor: string;
  genre_terror: string;
  genre_aventura: string;
  genre_ciencia_ficcion: string;
  genre_fantasia: string;
  // Buttons
  btn_generate: string;
  btn_generating: string;
  btn_illustrate: string;
  btn_reillustrate: string;
  btn_save: string;
  btn_share: string;
  btn_generating_pdf: string;
  // Story section
  story_generating_message: string;
  story_empty_placeholder: string;
  // Alerts
  alert_missing_story_title: string;
  alert_missing_story_msg: string;
  alert_narration_ready_title: string;
  alert_narration_ready_msg: string;
  alert_no_audio_title: string;
  alert_no_audio_msg: string;
  // Navbar / menu
  menu_home: string;
  menu_story_audio: string;
  menu_saved_stories: string;
  menu_settings: string;
  menu_contact: string;
  menu_help: string;
  menu_logout: string;
};

export const TRANSLATIONS: Record<AppLocale, TranslationKeys> = {
  es: {
    settings_title: 'Configuración',
    settings_voices_title: 'Voces narradoras',
    settings_app_language_title: 'Idioma de la app',
    settings_loading_voices: 'Cargando voces...',
    settings_version: 'Versión 1.0.0',
    settings_change_password: 'Cambiar Contraseña',
    settings_listen_demo: 'Escuchar demo',
    settings_playing: 'Reproduciendo...',
    maker_customization_title: 'Personalización',
    maker_your_story_title: 'Tu cuento',
    maker_central_theme_label: 'Tema central',
    maker_central_theme_placeholder: 'p. ej., miedo a la oscuridad',
    maker_skill_label: 'Habilidad socioemocional',
    maker_characters_label: 'Personajes (nombres/comas)',
    maker_characters_placeholder: 'Luna (prota), Tito (amigo)',
    maker_duration_label: 'Duración',
    maker_story_language_label: 'Idioma del cuento',
    maker_category_label: 'Categoría narrativa',
    maker_genre_label: 'Género (6-10 años)',
    age_2_5: '2-5 años',
    age_6_10: '6-10 años',
    category_disparatado: 'Disparatado',
    category_literario: 'Literario',
    category_rimas: 'Rimas y Poesía',
    genre_misterio: 'Misterio',
    genre_amor: 'Amor',
    genre_terror: 'Terror',
    genre_aventura: 'Aventura',
    genre_ciencia_ficcion: 'Ciencia Ficción',
    genre_fantasia: 'Fantasía',
    btn_generate: 'Generar cuento',
    btn_generating: 'Generando...',
    btn_illustrate: 'Ilustrar cuento',
    btn_reillustrate: 'Re-generar ilustraciones',
    btn_save: 'Guardar',
    btn_share: 'Compartir',
    btn_generating_pdf: 'Generando PDF...',
    story_generating_message: 'Creando una historia suave y luminosa...',
    story_empty_placeholder: 'Tu cuento aparecerá aquí. Completa el formulario y toca "Generar".',
    alert_missing_story_title: 'Falta el cuento',
    alert_missing_story_msg: 'Genera el cuento primero.',
    alert_narration_ready_title: 'Narración lista',
    alert_narration_ready_msg: 'Se guardó en tu galería. Ahora puedes compartirla.',
    alert_no_audio_title: 'Descarga primero',
    alert_no_audio_msg: 'Descarga la narración para poder compartirla.',
    menu_home: 'Inicio',
    menu_story_audio: 'Música y narrador',
    menu_saved_stories: 'Cuentos guardados',
    menu_settings: 'Configuración',
    menu_contact: 'Contacto',
    menu_help: 'Ayuda',
    menu_logout: 'Cerrar sesión',
  },
  en: {
    settings_title: 'Settings',
    settings_voices_title: 'Narrator voices',
    settings_app_language_title: 'App language',
    settings_loading_voices: 'Loading voices...',
    settings_version: 'Version 1.0.0',
    settings_change_password: 'Change Password',
    settings_listen_demo: 'Listen to demo',
    settings_playing: 'Playing...',
    maker_customization_title: 'Customization',
    maker_your_story_title: 'Your story',
    maker_central_theme_label: 'Central theme',
    maker_central_theme_placeholder: 'e.g., fear of the dark',
    maker_skill_label: 'Socioemotional skill',
    maker_characters_label: 'Characters (names/commas)',
    maker_characters_placeholder: 'Luna (main), Tito (friend)',
    maker_duration_label: 'Duration',
    maker_story_language_label: 'Story language',
    maker_category_label: 'Narrative category',
    maker_genre_label: 'Genre (ages 6-10)',
    age_2_5: '2-5 years',
    age_6_10: '6-10 years',
    category_disparatado: 'Wacky',
    category_literario: 'Literary',
    category_rimas: 'Rhymes & Poetry',
    genre_misterio: 'Mystery',
    genre_amor: 'Love',
    genre_terror: 'Horror',
    genre_aventura: 'Adventure',
    genre_ciencia_ficcion: 'Sci-Fi',
    genre_fantasia: 'Fantasy',
    btn_generate: 'Generate story',
    btn_generating: 'Generating...',
    btn_illustrate: 'Illustrate story',
    btn_reillustrate: 'Re-generate illustrations',
    btn_save: 'Save',
    btn_share: 'Share',
    btn_generating_pdf: 'Generating PDF...',
    story_generating_message: 'Creating a gentle, luminous story...',
    story_empty_placeholder: 'Your story will appear here. Fill in the form and tap "Generate".',
    alert_missing_story_title: 'Missing story',
    alert_missing_story_msg: 'Generate the story first.',
    alert_narration_ready_title: 'Narration ready',
    alert_narration_ready_msg: 'Saved to your gallery. You can share it now.',
    alert_no_audio_title: 'Download first',
    alert_no_audio_msg: 'Download the narration before sharing it.',
    menu_home: 'Home',
    menu_story_audio: 'Music & narrator',
    menu_saved_stories: 'Saved stories',
    menu_settings: 'Settings',
    menu_contact: 'Contact',
    menu_help: 'Help',
    menu_logout: 'Log out',
  },
  pt: {
    settings_title: 'Configurações',
    settings_voices_title: 'Vozes narradoras',
    settings_app_language_title: 'Idioma do app',
    settings_loading_voices: 'Carregando vozes...',
    settings_version: 'Versão 1.0.0',
    settings_change_password: 'Alterar Senha',
    settings_listen_demo: 'Ouvir demo',
    settings_playing: 'Reproduzindo...',
    maker_customization_title: 'Personalização',
    maker_your_story_title: 'Sua história',
    maker_central_theme_label: 'Tema central',
    maker_central_theme_placeholder: 'ex: medo do escuro',
    maker_skill_label: 'Habilidade socioemocional',
    maker_characters_label: 'Personagens (nomes/vírgulas)',
    maker_characters_placeholder: 'Luna (protagonista), Tito (amigo)',
    maker_duration_label: 'Duração',
    maker_story_language_label: 'Idioma da história',
    maker_category_label: 'Categoria narrativa',
    maker_genre_label: 'Gênero (6-10 anos)',
    age_2_5: '2-5 anos',
    age_6_10: '6-10 anos',
    category_disparatado: 'Disparatado',
    category_literario: 'Literário',
    category_rimas: 'Rimas e Poesia',
    genre_misterio: 'Mistério',
    genre_amor: 'Amor',
    genre_terror: 'Terror',
    genre_aventura: 'Aventura',
    genre_ciencia_ficcion: 'Ficção Científica',
    genre_fantasia: 'Fantasia',
    btn_generate: 'Gerar história',
    btn_generating: 'Gerando...',
    btn_illustrate: 'Ilustrar história',
    btn_reillustrate: 'Re-gerar ilustrações',
    btn_save: 'Salvar',
    btn_share: 'Compartilhar',
    btn_generating_pdf: 'Gerando PDF...',
    story_generating_message: 'Criando uma história suave e luminosa...',
    story_empty_placeholder: 'Sua história aparecerá aqui. Preencha o formulário e toque em "Gerar".',
    alert_missing_story_title: 'História ausente',
    alert_missing_story_msg: 'Gere a história primeiro.',
    alert_narration_ready_title: 'Narração pronta',
    alert_narration_ready_msg: 'Salvo na sua galeria. Agora você pode compartilhar.',
    alert_no_audio_title: 'Baixe primeiro',
    alert_no_audio_msg: 'Baixe a narração antes de compartilhá-la.',
    menu_home: 'Início',
    menu_story_audio: 'Música e narrador',
    menu_saved_stories: 'Histórias salvas',
    menu_settings: 'Configurações',
    menu_contact: 'Contato',
    menu_help: 'Ajuda',
    menu_logout: 'Sair',
  },
  ja: {
    settings_title: '設定',
    settings_voices_title: 'ナレーターの声',
    settings_app_language_title: 'アプリの言語',
    settings_loading_voices: '声を読み込み中...',
    settings_version: 'バージョン 1.0.0',
    settings_change_password: 'パスワードを変更',
    settings_listen_demo: 'デモを聴く',
    settings_playing: '再生中...',
    maker_customization_title: 'カスタマイズ',
    maker_your_story_title: 'あなたのお話',
    maker_central_theme_label: 'テーマ',
    maker_central_theme_placeholder: '例：暗闇への恐怖',
    maker_skill_label: '社会的・感情的スキル',
    maker_characters_label: 'キャラクター（名前/カンマ区切り）',
    maker_characters_placeholder: 'ルナ（主人公）、ティト（友達）',
    maker_duration_label: '長さ',
    maker_story_language_label: 'お話の言語',
    maker_category_label: '物語のカテゴリ',
    maker_genre_label: 'ジャンル（6〜10歳）',
    age_2_5: '2〜5歳',
    age_6_10: '6〜10歳',
    category_disparatado: 'おかしな話',
    category_literario: '文学的',
    category_rimas: '韻・詩',
    genre_misterio: 'ミステリー',
    genre_amor: '愛',
    genre_terror: 'ホラー',
    genre_aventura: '冒険',
    genre_ciencia_ficcion: 'SF',
    genre_fantasia: 'ファンタジー',
    btn_generate: 'お話を作る',
    btn_generating: '作成中...',
    btn_illustrate: 'イラストを作る',
    btn_reillustrate: 'イラストを再生成',
    btn_save: '保存',
    btn_share: '共有',
    btn_generating_pdf: 'PDF生成中...',
    story_generating_message: '優しくて明るいお話を作っています...',
    story_empty_placeholder: 'フォームを入力して「お話を作る」をタップするとお話がここに表示されます。',
    alert_missing_story_title: 'お話がありません',
    alert_missing_story_msg: 'まずお話を作成してください。',
    alert_narration_ready_title: '読み上げ準備完了',
    alert_narration_ready_msg: 'ギャラリーに保存されました。共有できます。',
    alert_no_audio_title: '先にダウンロード',
    alert_no_audio_msg: '共有する前に読み上げをダウンロードしてください。',
    menu_home: 'ホーム',
    menu_story_audio: '音楽とナレーター',
    menu_saved_stories: '保存したお話',
    menu_settings: '設定',
    menu_contact: 'お問い合わせ',
    menu_help: 'ヘルプ',
    menu_logout: 'ログアウト',
  },
};
