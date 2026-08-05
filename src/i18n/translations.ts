export type AppLocale = 'es' | 'en' | 'pt' | 'ja';

export type TranslationKeys = {
  // Settings screen
  settings_title: string;
  settings_voices_title: string;
  settings_app_language_title: string;
  settings_accent_title: string;
  settings_accent_auto: string;
  settings_loading_voices: string;
  settings_version: string;
  settings_change_password: string;
  settings_two_factor: string;
  settings_two_factor_on: string;
  settings_two_factor_off: string;
  twofa_title: string;
  twofa_intro: string;
  twofa_status_on: string;
  twofa_status_off: string;
  twofa_activate: string;
  twofa_deactivate: string;
  twofa_step_link: string;
  twofa_open_app: string;
  twofa_open_app_failed: string;
  twofa_manual_secret: string;
  twofa_copy: string;
  twofa_copied: string;
  twofa_show_qr: string;
  twofa_hide_qr: string;
  twofa_qr_hint: string;
  twofa_step_confirm: string;
  twofa_enter_code: string;
  twofa_code_label: string;
  twofa_verify: string;
  twofa_clock_hint: string;
  twofa_password_label: string;
  twofa_disable_confirm_title: string;
  twofa_disable_confirm_msg: string;
  twofa_backup_title: string;
  twofa_backup_intro: string;
  twofa_backup_warning: string;
  twofa_backup_saved_check: string;
  twofa_backup_copy_all: string;
  twofa_backup_share: string;
  twofa_backup_remaining: string;
  twofa_backup_regenerate: string;
  twofa_backup_regenerate_warning: string;
  twofa_done: string;
  twofa_challenge_title: string;
  twofa_challenge_intro: string;
  twofa_use_backup_code: string;
  twofa_use_totp_code: string;
  twofa_backup_code_label: string;
  twofa_attempts_left: string;
  msg_twofa_enabled_title: string;
  msg_twofa_enabled_msg: string;
  msg_twofa_disabled_title: string;
  msg_twofa_invalid_code_title: string;
  msg_twofa_expired_title: string;
  msg_twofa_expired_msg: string;
  msg_twofa_rate_limited_title: string;
  msg_twofa_codes_regenerated_title: string;
  settings_listen_demo: string;
  settings_playing: string;
  settings_stop_preview: string;
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
  // Mensajes al usuario (toasts y diálogos). Los que llevan {llaves} se pasan
  // por `fmt()` de src/i18n/format.ts.
  msg_ok: string;
  msg_cancel: string;
  msg_delete: string;
  msg_exit: string;
  msg_retry_hint: string;
  msg_unknown_error: string;
  msg_logout_failed_title: string;
  msg_logout_confirm_title: string;
  msg_logout_confirm_msg: string;
  msg_login_failed_title: string;
  msg_register_failed_title: string;
  msg_reset_link_sent_title: string;
  msg_reset_link_sent_msg: string;
  msg_reset_link_failed_title: string;
  msg_password_reset_title: string;
  msg_password_reset_msg: string;
  msg_password_changed_title: string;
  msg_password_changed_msg: string;
  msg_password_change_failed_title: string;
  msg_mobile_only_title: string;
  msg_mobile_only_pdf: string;
  msg_mobile_only_audio_download: string;
  msg_mobile_only_audio_share: string;
  msg_mobile_only_save: string;
  msg_pdf_web_title: string;
  msg_pdf_web_msg: string;
  msg_pdf_download_title: string;
  msg_pdf_download_msg: string;
  msg_share_failed_title: string;
  msg_pdf_open_failed_title: string;
  msg_pdf_missing_title: string;
  msg_pdf_missing_msg: string;
  msg_pdf_unsupported_title: string;
  msg_pdf_unsupported_msg: string;
  msg_story_saved_title: string;
  msg_story_saved_with_audio: string;
  msg_story_saved_without_audio: string;
  msg_no_space_title: string;
  msg_no_space_msg: string;
  msg_save_failed_title: string;
  msg_story_failed_title: string;
  msg_illustrations_failed_title: string;
  msg_illustrations_plan_incomplete: string;
  msg_illustrations_partial_title: string;
  msg_illustrations_partial_msg: string;
  msg_narration_failed_title: string;
  msg_narration_timeout_msg: string;
  msg_narration_generic_msg: string;
  msg_voice_preview_failed_title: string;
  msg_playback_failed_title: string;
  msg_playback_failed_msg: string;
  msg_delete_voice_title: string;
  msg_delete_voice_msg: string;
  msg_delete_voice_failed_title: string;
  msg_mic_permission_title: string;
  msg_mic_permission_msg: string;
  msg_voice_limit_title: string;
  msg_voice_save_failed_title: string;
  msg_delete_story_title: string;
  msg_delete_story_msg: string;
  msg_delete_story_failed_title: string;
  msg_contact_sent_title: string;
  msg_contact_sent_msg: string;
  msg_contact_failed_title: string;
  msg_profile_load_failed_title: string;
  msg_profile_update_failed_title: string;
  msg_language_updated_title: string;
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
    settings_accent_title: 'Acento de la narración',
    settings_accent_auto: 'Automático',
    settings_loading_voices: 'Cargando voces...',
    settings_version: 'Versión 1.0.0',
    settings_change_password: 'Cambiar Contraseña',
    settings_two_factor: 'Verificación en dos pasos',
    settings_two_factor_on: 'Activada',
    settings_two_factor_off: 'Desactivada',
    twofa_title: 'Verificación en dos pasos',
    twofa_intro: 'Además de tu contraseña, vas a necesitar un código de tu app de autenticación para entrar.',
    twofa_status_on: 'Está activada',
    twofa_status_off: 'Está desactivada',
    twofa_activate: 'Activar',
    twofa_deactivate: 'Desactivar',
    twofa_step_link: '1. Vinculá tu app de autenticación',
    twofa_open_app: 'Abrir mi app de autenticación',
    twofa_open_app_failed: 'No encontramos una app de autenticación. Copiá la clave de abajo y pegala a mano.',
    twofa_manual_secret: 'O cargá esta clave a mano:',
    twofa_copy: 'Copiar',
    twofa_copied: 'Copiado',
    twofa_show_qr: '¿Tenés otro dispositivo? Ver código QR',
    twofa_hide_qr: 'Ocultar código QR',
    twofa_qr_hint: 'Escaneá este código desde otro dispositivo.',
    twofa_step_confirm: '2. Confirmá que funciona',
    twofa_enter_code: 'Escribí el código de 6 dígitos que muestra tu app.',
    twofa_code_label: 'Código de 6 dígitos',
    twofa_verify: 'Verificar',
    twofa_clock_hint: 'Si el código no funciona, revisá que la hora del teléfono esté en automático.',
    twofa_password_label: 'Tu contraseña',
    twofa_disable_confirm_title: '¿Desactivar la verificación en dos pasos?',
    twofa_disable_confirm_msg: 'Tu cuenta va a quedar protegida solo por la contraseña.',
    twofa_backup_title: 'Códigos de respaldo',
    twofa_backup_intro: 'Guardá estos códigos en un lugar seguro. Cada uno sirve una sola vez.',
    twofa_backup_warning: 'No se vuelven a mostrar. Si perdés el teléfono y no los tenés, perdés el acceso a tu cuenta.',
    twofa_backup_saved_check: 'Ya los guardé en un lugar seguro',
    twofa_backup_copy_all: 'Copiar todos',
    twofa_backup_share: 'Compartir',
    twofa_backup_remaining: 'Códigos de respaldo disponibles',
    twofa_backup_regenerate: 'Generar códigos nuevos',
    twofa_backup_regenerate_warning: 'Los códigos anteriores dejan de servir.',
    twofa_done: 'Listo',
    twofa_challenge_title: 'Verificación en dos pasos',
    twofa_challenge_intro: 'Escribí el código que muestra tu app de autenticación.',
    twofa_use_backup_code: 'Usar un código de respaldo',
    twofa_use_totp_code: 'Usar el código de la app',
    twofa_backup_code_label: 'Código de respaldo',
    twofa_attempts_left: 'Te quedan {n} intentos',
    msg_twofa_enabled_title: 'Verificación en dos pasos activada',
    msg_twofa_enabled_msg: 'Guardá tus códigos de respaldo.',
    msg_twofa_disabled_title: 'Verificación en dos pasos desactivada',
    msg_twofa_invalid_code_title: 'Código incorrecto',
    msg_twofa_expired_title: 'Se venció el tiempo',
    msg_twofa_expired_msg: 'Volvé a iniciar sesión.',
    msg_twofa_rate_limited_title: 'Demasiados intentos',
    msg_twofa_codes_regenerated_title: 'Códigos nuevos generados',
    settings_listen_demo: 'Escuchar demo',
    settings_playing: 'Reproduciendo...',
    settings_stop_preview: 'Detener',
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
    msg_ok: 'Listo',
    msg_cancel: 'Cancelar',
    msg_delete: 'Borrar',
    msg_exit: 'Salir',
    msg_retry_hint: 'Intentalo de nuevo.',
    msg_unknown_error: 'Algo salió mal.',
    msg_logout_failed_title: 'No pudimos cerrar la sesión',
    msg_logout_confirm_title: 'Cerrar sesión',
    msg_logout_confirm_msg: '¿Seguro que querés salir?',
    msg_login_failed_title: 'No pudimos iniciar sesión',
    msg_register_failed_title: 'No pudimos crear tu cuenta',
    msg_reset_link_sent_title: 'Revisá tu correo',
    msg_reset_link_sent_msg: 'Te enviamos un enlace para restablecer tu contraseña.',
    msg_reset_link_failed_title: 'No pudimos enviar el enlace',
    msg_password_reset_title: '¡Listo!',
    msg_password_reset_msg: 'Contraseña restablecida. Ya podés iniciar sesión.',
    msg_password_changed_title: 'Contraseña actualizada',
    msg_password_changed_msg: 'Tu contraseña cambió. Volvé a iniciar sesión.',
    msg_password_change_failed_title: 'No pudimos cambiar la contraseña',
    msg_mobile_only_title: 'Usá la app en el teléfono',
    msg_mobile_only_pdf: 'Abrir el PDF funciona en dispositivo o emulador, no en web.',
    msg_mobile_only_audio_download: 'La descarga de audio funciona en dispositivo o emulador, no en web.',
    msg_mobile_only_audio_share: 'Compartir audio funciona en dispositivo o emulador, no en web.',
    msg_mobile_only_save: 'Guardar el cuento completo funciona en dispositivo o emulador, no en web.',
    msg_pdf_web_title: 'Abrí el PDF',
    msg_pdf_web_msg: 'Se abrió el diálogo de impresión. Elegí "Guardar como PDF", con márgenes en "Ninguno" y "Gráficos de fondo" activado.',
    msg_pdf_download_title: 'Descargá tu PDF',
    msg_pdf_download_msg: 'Usá "Guardar como PDF" en el diálogo del navegador, con márgenes en "Ninguno" y "Gráficos de fondo" activado.',
    msg_share_failed_title: 'No pudimos compartir',
    msg_pdf_open_failed_title: 'No pudimos abrir el PDF',
    msg_pdf_missing_title: 'Este cuento no tiene PDF',
    msg_pdf_missing_msg: 'Se guardó sin PDF. Abrilo desde "Inicio" y volvé a guardarlo.',
    msg_pdf_unsupported_title: 'No disponible',
    msg_pdf_unsupported_msg: 'Este dispositivo no puede abrir el PDF.',
    msg_story_saved_title: 'Cuento guardado',
    msg_story_saved_with_audio: 'Ya está en "Cuentos guardados", listo para volver a escucharlo.',
    msg_story_saved_without_audio: 'Ya está en "Cuentos guardados". Todavía no tiene narración: generala en "Música y narrador" y volvé a guardar.',
    msg_no_space_title: 'Sin espacio',
    msg_no_space_msg: 'Tu biblioteca está llena. Borrá cuentos guardados o liberá espacio en el dispositivo.',
    msg_save_failed_title: 'No pudimos guardar el cuento',
    msg_story_failed_title: 'No pudimos crear el cuento',
    msg_illustrations_failed_title: 'No pudimos crear las ilustraciones',
    msg_illustrations_plan_incomplete: 'El plan de ilustraciones está incompleto.',
    msg_illustrations_partial_title: 'Faltaron algunas ilustraciones',
    msg_illustrations_partial_msg: 'No pudimos generar {failed} de {total} escenas. Tocá "Reilustrar" para reintentar.',
    msg_narration_failed_title: 'No pudimos narrar el cuento',
    msg_narration_timeout_msg: 'La generación de voz tardó demasiado. Intentá de nuevo.',
    msg_narration_generic_msg: 'No se pudo narrar el cuento.',
    msg_voice_preview_failed_title: 'No pudimos reproducir la voz',
    msg_playback_failed_title: 'No pudimos reproducir',
    msg_playback_failed_msg: 'El archivo de narración no está disponible.',
    msg_delete_voice_title: 'Borrar grabación',
    msg_delete_voice_msg: '¿Borrar la voz "{label}"? Vas a poder volver a grabarla cuando quieras.',
    msg_delete_voice_failed_title: 'No pudimos borrar la voz',
    msg_mic_permission_title: 'Necesitamos el micrófono',
    msg_mic_permission_msg: 'Dale permiso a la app para grabar tu voz.',
    msg_voice_limit_title: 'Llegaste al límite',
    msg_voice_save_failed_title: 'No pudimos guardar la grabación',
    msg_delete_story_title: 'Borrar cuento',
    msg_delete_story_msg: '¿Borrar "{title}"? Se borran el texto, las ilustraciones y la narración guardados.',
    msg_delete_story_failed_title: 'No pudimos borrar el cuento',
    msg_contact_sent_title: 'Mensaje enviado',
    msg_contact_sent_msg: '¡Gracias por escribirnos!',
    msg_contact_failed_title: 'No pudimos enviar el mensaje',
    msg_profile_load_failed_title: 'No pudimos cargar tu perfil',
    msg_profile_update_failed_title: 'No pudimos actualizar tu perfil',
    msg_language_updated_title: 'Idioma actualizado',
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
    settings_accent_title: 'Narration accent',
    settings_accent_auto: 'Automatic',
    settings_loading_voices: 'Loading voices...',
    settings_version: 'Version 1.0.0',
    settings_change_password: 'Change Password',
    settings_two_factor: 'Two-factor authentication',
    settings_two_factor_on: 'On',
    settings_two_factor_off: 'Off',
    twofa_title: 'Two-factor authentication',
    twofa_intro: 'Along with your password, you will need a code from your authenticator app to sign in.',
    twofa_status_on: 'It is on',
    twofa_status_off: 'It is off',
    twofa_activate: 'Turn on',
    twofa_deactivate: 'Turn off',
    twofa_step_link: '1. Link your authenticator app',
    twofa_open_app: 'Open my authenticator app',
    twofa_open_app_failed: 'We could not find an authenticator app. Copy the key below and paste it manually.',
    twofa_manual_secret: 'Or enter this key manually:',
    twofa_copy: 'Copy',
    twofa_copied: 'Copied',
    twofa_show_qr: 'Have another device? Show QR code',
    twofa_hide_qr: 'Hide QR code',
    twofa_qr_hint: 'Scan this code from another device.',
    twofa_step_confirm: '2. Confirm it works',
    twofa_enter_code: 'Enter the 6-digit code shown in your app.',
    twofa_code_label: '6-digit code',
    twofa_verify: 'Verify',
    twofa_clock_hint: 'If the code does not work, check that your phone time is set automatically.',
    twofa_password_label: 'Your password',
    twofa_disable_confirm_title: 'Turn off two-factor authentication?',
    twofa_disable_confirm_msg: 'Your account will be protected by your password only.',
    twofa_backup_title: 'Backup codes',
    twofa_backup_intro: 'Save these codes somewhere safe. Each one works only once.',
    twofa_backup_warning: 'They will not be shown again. If you lose your phone and do not have them, you lose access to your account.',
    twofa_backup_saved_check: 'I saved them somewhere safe',
    twofa_backup_copy_all: 'Copy all',
    twofa_backup_share: 'Share',
    twofa_backup_remaining: 'Backup codes left',
    twofa_backup_regenerate: 'Generate new codes',
    twofa_backup_regenerate_warning: 'The previous codes stop working.',
    twofa_done: 'Done',
    twofa_challenge_title: 'Two-factor authentication',
    twofa_challenge_intro: 'Enter the code shown in your authenticator app.',
    twofa_use_backup_code: 'Use a backup code',
    twofa_use_totp_code: 'Use the app code',
    twofa_backup_code_label: 'Backup code',
    twofa_attempts_left: '{n} attempts left',
    msg_twofa_enabled_title: 'Two-factor authentication is on',
    msg_twofa_enabled_msg: 'Save your backup codes.',
    msg_twofa_disabled_title: 'Two-factor authentication is off',
    msg_twofa_invalid_code_title: 'Incorrect code',
    msg_twofa_expired_title: 'Time ran out',
    msg_twofa_expired_msg: 'Please sign in again.',
    msg_twofa_rate_limited_title: 'Too many attempts',
    msg_twofa_codes_regenerated_title: 'New codes generated',
    settings_listen_demo: 'Listen to demo',
    settings_playing: 'Playing...',
    settings_stop_preview: 'Stop',
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
    msg_ok: 'Got it',
    msg_cancel: 'Cancel',
    msg_delete: 'Delete',
    msg_exit: 'Log out',
    msg_retry_hint: 'Please try again.',
    msg_unknown_error: 'Something went wrong.',
    msg_logout_failed_title: "We couldn't log you out",
    msg_logout_confirm_title: 'Log out',
    msg_logout_confirm_msg: 'Are you sure you want to leave?',
    msg_login_failed_title: "We couldn't sign you in",
    msg_register_failed_title: "We couldn't create your account",
    msg_reset_link_sent_title: 'Check your inbox',
    msg_reset_link_sent_msg: 'We sent you a link to reset your password.',
    msg_reset_link_failed_title: "We couldn't send the link",
    msg_password_reset_title: 'All set!',
    msg_password_reset_msg: 'Your password was reset. You can sign in now.',
    msg_password_changed_title: 'Password updated',
    msg_password_changed_msg: 'Your password changed. Please sign in again.',
    msg_password_change_failed_title: "We couldn't change your password",
    msg_mobile_only_title: 'Use the phone app',
    msg_mobile_only_pdf: 'Opening the PDF works on a device or emulator, not on the web.',
    msg_mobile_only_audio_download: 'Downloading audio works on a device or emulator, not on the web.',
    msg_mobile_only_audio_share: 'Sharing audio works on a device or emulator, not on the web.',
    msg_mobile_only_save: 'Saving the full story works on a device or emulator, not on the web.',
    msg_pdf_web_title: 'Open your PDF',
    msg_pdf_web_msg: 'The print dialog is open. Choose "Save as PDF", set margins to "None" and turn on "Background graphics".',
    msg_pdf_download_title: 'Download your PDF',
    msg_pdf_download_msg: 'Use "Save as PDF" in the browser dialog, with margins set to "None" and "Background graphics" turned on.',
    msg_share_failed_title: "We couldn't share it",
    msg_pdf_open_failed_title: "We couldn't open the PDF",
    msg_pdf_missing_title: 'This story has no PDF',
    msg_pdf_missing_msg: 'It was saved without a PDF. Open it from "Home" and save it again.',
    msg_pdf_unsupported_title: 'Not available',
    msg_pdf_unsupported_msg: "This device can't open the PDF.",
    msg_story_saved_title: 'Story saved',
    msg_story_saved_with_audio: "It's in \"Saved stories\", ready to listen again.",
    msg_story_saved_without_audio: 'It\'s in "Saved stories". It has no narration yet: create one in "Music and narrator" and save again.',
    msg_no_space_title: 'Out of space',
    msg_no_space_msg: 'Your library is full. Delete saved stories or free up space on your device.',
    msg_save_failed_title: "We couldn't save the story",
    msg_story_failed_title: "We couldn't create the story",
    msg_illustrations_failed_title: "We couldn't create the illustrations",
    msg_illustrations_plan_incomplete: 'The illustration plan is incomplete.',
    msg_illustrations_partial_title: 'Some illustrations are missing',
    msg_illustrations_partial_msg: 'We couldn\'t generate {failed} of {total} scenes. Tap "Illustrate again" to retry.',
    msg_narration_failed_title: "We couldn't narrate the story",
    msg_narration_timeout_msg: 'Voice generation took too long. Please try again.',
    msg_narration_generic_msg: "The story couldn't be narrated.",
    msg_voice_preview_failed_title: "We couldn't play that voice",
    msg_playback_failed_title: "We couldn't play it",
    msg_playback_failed_msg: 'The narration file is not available.',
    msg_delete_voice_title: 'Delete recording',
    msg_delete_voice_msg: 'Delete the voice "{label}"? You can record it again whenever you like.',
    msg_delete_voice_failed_title: "We couldn't delete the voice",
    msg_mic_permission_title: 'We need the microphone',
    msg_mic_permission_msg: 'Allow the app to record your voice.',
    msg_voice_limit_title: 'Limit reached',
    msg_voice_save_failed_title: "We couldn't save the recording",
    msg_delete_story_title: 'Delete story',
    msg_delete_story_msg: 'Delete "{title}"? The saved text, illustrations and narration will be removed.',
    msg_delete_story_failed_title: "We couldn't delete the story",
    msg_contact_sent_title: 'Message sent',
    msg_contact_sent_msg: 'Thanks for writing to us!',
    msg_contact_failed_title: "We couldn't send your message",
    msg_profile_load_failed_title: "We couldn't load your profile",
    msg_profile_update_failed_title: "We couldn't update your profile",
    msg_language_updated_title: 'Language updated',
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
    settings_accent_title: 'Sotaque da narração',
    settings_accent_auto: 'Automático',
    settings_loading_voices: 'Carregando vozes...',
    settings_version: 'Versão 1.0.0',
    settings_change_password: 'Alterar Senha',
    settings_two_factor: 'Verificação em duas etapas',
    settings_two_factor_on: 'Ativada',
    settings_two_factor_off: 'Desativada',
    twofa_title: 'Verificação em duas etapas',
    twofa_intro: 'Além da sua senha, você vai precisar de um código do seu app autenticador para entrar.',
    twofa_status_on: 'Está ativada',
    twofa_status_off: 'Está desativada',
    twofa_activate: 'Ativar',
    twofa_deactivate: 'Desativar',
    twofa_step_link: '1. Vincule seu app autenticador',
    twofa_open_app: 'Abrir meu app autenticador',
    twofa_open_app_failed: 'Não encontramos um app autenticador. Copie a chave abaixo e cole manualmente.',
    twofa_manual_secret: 'Ou insira esta chave manualmente:',
    twofa_copy: 'Copiar',
    twofa_copied: 'Copiado',
    twofa_show_qr: 'Tem outro dispositivo? Ver código QR',
    twofa_hide_qr: 'Ocultar código QR',
    twofa_qr_hint: 'Escaneie este código de outro dispositivo.',
    twofa_step_confirm: '2. Confirme que funciona',
    twofa_enter_code: 'Digite o código de 6 dígitos que aparece no seu app.',
    twofa_code_label: 'Código de 6 dígitos',
    twofa_verify: 'Verificar',
    twofa_clock_hint: 'Se o código não funcionar, verifique se a hora do telefone está automática.',
    twofa_password_label: 'Sua senha',
    twofa_disable_confirm_title: 'Desativar a verificação em duas etapas?',
    twofa_disable_confirm_msg: 'Sua conta ficará protegida apenas pela senha.',
    twofa_backup_title: 'Códigos de backup',
    twofa_backup_intro: 'Guarde estes códigos em um lugar seguro. Cada um serve uma única vez.',
    twofa_backup_warning: 'Eles não serão mostrados de novo. Se perder o telefone e não tiver os códigos, você perde o acesso à conta.',
    twofa_backup_saved_check: 'Já guardei em um lugar seguro',
    twofa_backup_copy_all: 'Copiar todos',
    twofa_backup_share: 'Compartilhar',
    twofa_backup_remaining: 'Códigos de backup disponíveis',
    twofa_backup_regenerate: 'Gerar códigos novos',
    twofa_backup_regenerate_warning: 'Os códigos anteriores deixam de funcionar.',
    twofa_done: 'Pronto',
    twofa_challenge_title: 'Verificação em duas etapas',
    twofa_challenge_intro: 'Digite o código que aparece no seu app autenticador.',
    twofa_use_backup_code: 'Usar um código de backup',
    twofa_use_totp_code: 'Usar o código do app',
    twofa_backup_code_label: 'Código de backup',
    twofa_attempts_left: 'Restam {n} tentativas',
    msg_twofa_enabled_title: 'Verificação em duas etapas ativada',
    msg_twofa_enabled_msg: 'Guarde seus códigos de backup.',
    msg_twofa_disabled_title: 'Verificação em duas etapas desativada',
    msg_twofa_invalid_code_title: 'Código incorreto',
    msg_twofa_expired_title: 'O tempo acabou',
    msg_twofa_expired_msg: 'Entre novamente.',
    msg_twofa_rate_limited_title: 'Tentativas demais',
    msg_twofa_codes_regenerated_title: 'Novos códigos gerados',
    settings_listen_demo: 'Ouvir demo',
    settings_playing: 'Reproduzindo...',
    settings_stop_preview: 'Parar',
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
    msg_ok: 'Entendi',
    msg_cancel: 'Cancelar',
    msg_delete: 'Apagar',
    msg_exit: 'Sair',
    msg_retry_hint: 'Tente de novo.',
    msg_unknown_error: 'Algo deu errado.',
    msg_logout_failed_title: 'Não conseguimos encerrar a sessão',
    msg_logout_confirm_title: 'Sair da conta',
    msg_logout_confirm_msg: 'Tem certeza de que quer sair?',
    msg_login_failed_title: 'Não conseguimos entrar',
    msg_register_failed_title: 'Não conseguimos criar sua conta',
    msg_reset_link_sent_title: 'Confira seu e-mail',
    msg_reset_link_sent_msg: 'Enviamos um link para redefinir sua senha.',
    msg_reset_link_failed_title: 'Não conseguimos enviar o link',
    msg_password_reset_title: 'Pronto!',
    msg_password_reset_msg: 'Senha redefinida. Já pode entrar.',
    msg_password_changed_title: 'Senha atualizada',
    msg_password_changed_msg: 'Sua senha mudou. Entre novamente.',
    msg_password_change_failed_title: 'Não conseguimos mudar a senha',
    msg_mobile_only_title: 'Use o app no celular',
    msg_mobile_only_pdf: 'Abrir o PDF funciona no dispositivo ou emulador, não na web.',
    msg_mobile_only_audio_download: 'Baixar o áudio funciona no dispositivo ou emulador, não na web.',
    msg_mobile_only_audio_share: 'Compartilhar áudio funciona no dispositivo ou emulador, não na web.',
    msg_mobile_only_save: 'Salvar a história completa funciona no dispositivo ou emulador, não na web.',
    msg_pdf_web_title: 'Abra o PDF',
    msg_pdf_web_msg: 'A janela de impressão foi aberta. Escolha "Salvar como PDF", com margens em "Nenhuma" e "Gráficos de plano de fundo" ativado.',
    msg_pdf_download_title: 'Baixe seu PDF',
    msg_pdf_download_msg: 'Use "Salvar como PDF" na janela do navegador, com margens em "Nenhuma" e "Gráficos de plano de fundo" ativado.',
    msg_share_failed_title: 'Não conseguimos compartilhar',
    msg_pdf_open_failed_title: 'Não conseguimos abrir o PDF',
    msg_pdf_missing_title: 'Esta história não tem PDF',
    msg_pdf_missing_msg: 'Foi salva sem PDF. Abra em "Início" e salve de novo.',
    msg_pdf_unsupported_title: 'Indisponível',
    msg_pdf_unsupported_msg: 'Este dispositivo não consegue abrir o PDF.',
    msg_story_saved_title: 'História salva',
    msg_story_saved_with_audio: 'Já está em "Histórias salvas", pronta para ouvir de novo.',
    msg_story_saved_without_audio: 'Já está em "Histórias salvas". Ainda não tem narração: crie em "Música e narrador" e salve de novo.',
    msg_no_space_title: 'Sem espaço',
    msg_no_space_msg: 'Sua biblioteca está cheia. Apague histórias salvas ou libere espaço no dispositivo.',
    msg_save_failed_title: 'Não conseguimos salvar a história',
    msg_story_failed_title: 'Não conseguimos criar a história',
    msg_illustrations_failed_title: 'Não conseguimos criar as ilustrações',
    msg_illustrations_plan_incomplete: 'O plano de ilustrações está incompleto.',
    msg_illustrations_partial_title: 'Faltaram algumas ilustrações',
    msg_illustrations_partial_msg: 'Não conseguimos gerar {failed} de {total} cenas. Toque em "Ilustrar de novo" para tentar outra vez.',
    msg_narration_failed_title: 'Não conseguimos narrar a história',
    msg_narration_timeout_msg: 'A geração de voz demorou demais. Tente de novo.',
    msg_narration_generic_msg: 'Não foi possível narrar a história.',
    msg_voice_preview_failed_title: 'Não conseguimos tocar essa voz',
    msg_playback_failed_title: 'Não conseguimos reproduzir',
    msg_playback_failed_msg: 'O arquivo de narração não está disponível.',
    msg_delete_voice_title: 'Apagar gravação',
    msg_delete_voice_msg: 'Apagar a voz "{label}"? Você pode gravá-la de novo quando quiser.',
    msg_delete_voice_failed_title: 'Não conseguimos apagar a voz',
    msg_mic_permission_title: 'Precisamos do microfone',
    msg_mic_permission_msg: 'Permita que o app grave sua voz.',
    msg_voice_limit_title: 'Você chegou ao limite',
    msg_voice_save_failed_title: 'Não conseguimos salvar a gravação',
    msg_delete_story_title: 'Apagar história',
    msg_delete_story_msg: 'Apagar "{title}"? O texto, as ilustrações e a narração salvos serão removidos.',
    msg_delete_story_failed_title: 'Não conseguimos apagar a história',
    msg_contact_sent_title: 'Mensagem enviada',
    msg_contact_sent_msg: 'Obrigado por escrever para nós!',
    msg_contact_failed_title: 'Não conseguimos enviar sua mensagem',
    msg_profile_load_failed_title: 'Não conseguimos carregar seu perfil',
    msg_profile_update_failed_title: 'Não conseguimos atualizar seu perfil',
    msg_language_updated_title: 'Idioma atualizado',
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
    settings_accent_title: 'ナレーションのアクセント',
    settings_accent_auto: '自動',
    settings_loading_voices: '声を読み込み中...',
    settings_version: 'バージョン 1.0.0',
    settings_change_password: 'パスワードを変更',
    settings_two_factor: '2段階認証',
    settings_two_factor_on: 'オン',
    settings_two_factor_off: 'オフ',
    twofa_title: '2段階認証',
    twofa_intro: 'パスワードに加えて、認証アプリのコードでログインします。',
    twofa_status_on: 'オンになっています',
    twofa_status_off: 'オフになっています',
    twofa_activate: '有効にする',
    twofa_deactivate: '無効にする',
    twofa_step_link: '1. 認証アプリを連携する',
    twofa_open_app: '認証アプリを開く',
    twofa_open_app_failed: '認証アプリが見つかりませんでした。下のキーをコピーして手動で貼り付けてください。',
    twofa_manual_secret: 'または、このキーを手動で入力してください:',
    twofa_copy: 'コピー',
    twofa_copied: 'コピーしました',
    twofa_show_qr: '別の端末をお持ちですか？QRコードを表示',
    twofa_hide_qr: 'QRコードを隠す',
    twofa_qr_hint: '別の端末からこのコードをスキャンしてください。',
    twofa_step_confirm: '2. 動作を確認する',
    twofa_enter_code: 'アプリに表示された6桁のコードを入力してください。',
    twofa_code_label: '6桁のコード',
    twofa_verify: '確認',
    twofa_clock_hint: 'コードが使えない場合は、端末の時刻設定が自動になっているか確認してください。',
    twofa_password_label: 'パスワード',
    twofa_disable_confirm_title: '2段階認証を無効にしますか？',
    twofa_disable_confirm_msg: 'アカウントはパスワードのみで保護されます。',
    twofa_backup_title: 'バックアップコード',
    twofa_backup_intro: 'これらのコードを安全な場所に保管してください。各コードは1回だけ使えます。',
    twofa_backup_warning: '二度と表示されません。端末を紛失してコードもない場合、アカウントにアクセスできなくなります。',
    twofa_backup_saved_check: '安全な場所に保管しました',
    twofa_backup_copy_all: 'すべてコピー',
    twofa_backup_share: '共有',
    twofa_backup_remaining: '残りのバックアップコード',
    twofa_backup_regenerate: '新しいコードを生成',
    twofa_backup_regenerate_warning: '以前のコードは使えなくなります。',
    twofa_done: '完了',
    twofa_challenge_title: '2段階認証',
    twofa_challenge_intro: '認証アプリに表示されたコードを入力してください。',
    twofa_use_backup_code: 'バックアップコードを使う',
    twofa_use_totp_code: 'アプリのコードを使う',
    twofa_backup_code_label: 'バックアップコード',
    twofa_attempts_left: '残り{n}回',
    msg_twofa_enabled_title: '2段階認証を有効にしました',
    msg_twofa_enabled_msg: 'バックアップコードを保管してください。',
    msg_twofa_disabled_title: '2段階認証を無効にしました',
    msg_twofa_invalid_code_title: 'コードが正しくありません',
    msg_twofa_expired_title: '時間切れです',
    msg_twofa_expired_msg: 'もう一度ログインしてください。',
    msg_twofa_rate_limited_title: '試行回数が多すぎます',
    msg_twofa_codes_regenerated_title: '新しいコードを生成しました',
    settings_listen_demo: 'デモを聴く',
    settings_playing: '再生中...',
    settings_stop_preview: '停止',
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
    msg_ok: 'OK',
    msg_cancel: 'キャンセル',
    msg_delete: '削除',
    msg_exit: 'ログアウト',
    msg_retry_hint: 'もう一度お試しください。',
    msg_unknown_error: '問題が発生しました。',
    msg_logout_failed_title: 'ログアウトできませんでした',
    msg_logout_confirm_title: 'ログアウト',
    msg_logout_confirm_msg: '本当にログアウトしますか？',
    msg_login_failed_title: 'ログインできませんでした',
    msg_register_failed_title: 'アカウントを作成できませんでした',
    msg_reset_link_sent_title: 'メールをご確認ください',
    msg_reset_link_sent_msg: 'パスワード再設定用のリンクを送信しました。',
    msg_reset_link_failed_title: 'リンクを送信できませんでした',
    msg_password_reset_title: '完了しました',
    msg_password_reset_msg: 'パスワードを再設定しました。ログインできます。',
    msg_password_changed_title: 'パスワードを更新しました',
    msg_password_changed_msg: 'パスワードが変更されました。もう一度ログインしてください。',
    msg_password_change_failed_title: 'パスワードを変更できませんでした',
    msg_mobile_only_title: 'スマホアプリをご利用ください',
    msg_mobile_only_pdf: 'PDFを開く機能は実機またはエミュレーターでのみ動作します。',
    msg_mobile_only_audio_download: '音声のダウンロードは実機またはエミュレーターでのみ動作します。',
    msg_mobile_only_audio_share: '音声の共有は実機またはエミュレーターでのみ動作します。',
    msg_mobile_only_save: 'お話全体の保存は実機またはエミュレーターでのみ動作します。',
    msg_pdf_web_title: 'PDFを開いてください',
    msg_pdf_web_msg: '印刷ダイアログを開きました。「PDFに保存」を選び、余白を「なし」、「背景のグラフィック」をオンにしてください。',
    msg_pdf_download_title: 'PDFをダウンロード',
    msg_pdf_download_msg: 'ブラウザのダイアログで「PDFに保存」を選び、余白を「なし」、「背景のグラフィック」をオンにしてください。',
    msg_share_failed_title: '共有できませんでした',
    msg_pdf_open_failed_title: 'PDFを開けませんでした',
    msg_pdf_missing_title: 'このお話にPDFはありません',
    msg_pdf_missing_msg: 'PDFなしで保存されました。「ホーム」から開いて保存し直してください。',
    msg_pdf_unsupported_title: '利用できません',
    msg_pdf_unsupported_msg: 'この端末ではPDFを開けません。',
    msg_story_saved_title: 'お話を保存しました',
    msg_story_saved_with_audio: '「保存したお話」に入りました。もう一度聴けます。',
    msg_story_saved_without_audio: '「保存したお話」に入りました。読み上げはまだありません。「音楽とナレーター」で作成して保存し直してください。',
    msg_no_space_title: '空き容量がありません',
    msg_no_space_msg: 'ライブラリがいっぱいです。保存したお話を削除するか、端末の空き容量を増やしてください。',
    msg_save_failed_title: 'お話を保存できませんでした',
    msg_story_failed_title: 'お話を作成できませんでした',
    msg_illustrations_failed_title: 'イラストを作成できませんでした',
    msg_illustrations_plan_incomplete: 'イラストの構成が不完全です。',
    msg_illustrations_partial_title: '一部のイラストが作れませんでした',
    msg_illustrations_partial_msg: '{total}シーン中{failed}シーンを生成できませんでした。「もう一度イラストを作る」を押してください。',
    msg_narration_failed_title: 'お話を読み上げられませんでした',
    msg_narration_timeout_msg: '音声の生成に時間がかかりすぎました。もう一度お試しください。',
    msg_narration_generic_msg: 'お話を読み上げられませんでした。',
    msg_voice_preview_failed_title: 'この声を再生できませんでした',
    msg_playback_failed_title: '再生できませんでした',
    msg_playback_failed_msg: '読み上げファイルが見つかりません。',
    msg_delete_voice_title: '録音を削除',
    msg_delete_voice_msg: '「{label}」の声を削除しますか？いつでも録り直せます。',
    msg_delete_voice_failed_title: '声を削除できませんでした',
    msg_mic_permission_title: 'マイクの許可が必要です',
    msg_mic_permission_msg: '声を録音するためにマイクへのアクセスを許可してください。',
    msg_voice_limit_title: '上限に達しました',
    msg_voice_save_failed_title: '録音を保存できませんでした',
    msg_delete_story_title: 'お話を削除',
    msg_delete_story_msg: '「{title}」を削除しますか？保存されたテキスト、イラスト、読み上げも削除されます。',
    msg_delete_story_failed_title: 'お話を削除できませんでした',
    msg_contact_sent_title: 'メッセージを送信しました',
    msg_contact_sent_msg: 'ご連絡ありがとうございます。',
    msg_contact_failed_title: 'メッセージを送信できませんでした',
    msg_profile_load_failed_title: 'プロフィールを読み込めませんでした',
    msg_profile_update_failed_title: 'プロフィールを更新できませんでした',
    msg_language_updated_title: '言語を更新しました',
    menu_home: 'ホーム',
    menu_story_audio: '音楽とナレーター',
    menu_saved_stories: '保存したお話',
    menu_settings: '設定',
    menu_contact: 'お問い合わせ',
    menu_help: 'ヘルプ',
    menu_logout: 'ログアウト',
  },
};
