import { Href } from 'expo-router';
import { NavbarMenuItem } from '../components/AppNavbar';

export const MENU_ITEMS: NavbarMenuItem[] = [
    { label: 'Inicio', icon: 'home', href: '/maker' as Href, replace: true },
    { label: 'Configuración', icon: 'settings', href: '/settings' as Href },
    { label: 'Contacto', icon: 'mail', href: '/contact' as Href },
    { label: 'Ayuda', icon: 'help-circle', href: '/help' as Href },
    { label: 'Cerrar sesion', icon: 'log-out', action: 'logout' },
];
