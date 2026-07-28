import { Href } from 'expo-router';
import { NavbarMenuItem } from '../components/AppNavbar';
import { TranslationKeys } from '../i18n/translations';

export function buildMenuItems(t: TranslationKeys): NavbarMenuItem[] {
  return [
    { label: t.menu_home, icon: 'home', href: '/maker' as Href, replace: true },
    { label: t.menu_story_audio, icon: 'music', href: '/story-audio' as Href },
    { label: t.menu_saved_stories, icon: 'book-open', href: '/cuentos-guardados' as Href },
    { label: t.menu_settings, icon: 'settings', href: '/settings' as Href },
    { label: t.menu_contact, icon: 'mail', href: '/contact' as Href },
    { label: t.menu_help, icon: 'help-circle', href: '/help' as Href },
    { label: t.menu_logout, icon: 'log-out', action: 'logout' },
  ];
}

// Backward-compat: static Spanish fallback for any code that hasn't migrated yet
export const MENU_ITEMS: NavbarMenuItem[] = [
  { label: 'Inicio', icon: 'home', href: '/maker' as Href, replace: true },
  { label: 'Música y narrador', icon: 'music', href: '/story-audio' as Href },
  { label: 'Cuentos guardados', icon: 'book-open', href: '/cuentos-guardados' as Href },
  { label: 'Configuración', icon: 'settings', href: '/settings' as Href },
  { label: 'Contacto', icon: 'mail', href: '/contact' as Href },
  { label: 'Ayuda', icon: 'help-circle', href: '/help' as Href },
  { label: 'Cerrar sesion', icon: 'log-out', action: 'logout' },
];
