import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { THEME } from '../theme';

export type NavbarMenuItem = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  href?: Href;
  replace?: boolean;
  action?: 'logout';
};

export type AppNavbarProps = {
  name?: string;
  greetingPrefix?: string;
  menuItems: NavbarMenuItem[];
  onLogout?: () => Promise<void> | void;
  loggingOut?: boolean;
};

const NAV_BG = 'rgba(11, 18, 38, 0.75)';
const MENU_BG = 'rgba(14, 22, 48, 0.94)';

export default function AppNavbar({
  name,
  greetingPrefix = 'Hola',
  menuItems,
  onLogout,
  loggingOut,
}: AppNavbarProps) {
  const [open, setOpen] = React.useState(false);
  const greeting = `${greetingPrefix}${name ? `, ${name}` : ''}`;

  const toggle = React.useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  const closeMenu = React.useCallback(() => setOpen(false), []);

  const handleSelect = React.useCallback(
    async (item: NavbarMenuItem) => {
      closeMenu();
      if (item.action === 'logout') {
        if (onLogout) await onLogout();
        return;
      }
      if (!item.href) return;
      if (item.replace) {
        router.replace(item.href);
      } else {
        router.push(item.href);
      }
    },
    [closeMenu, onLogout],
  );

  return (
    <View style={{ marginBottom: 16 }}>
      <Animated.View
        entering={FadeIn.duration(500)}
        style={{
          backgroundColor: NAV_BG,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: THEME.border,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, minWidth: 0 }}>
          <Feather name='star' size={22} color={THEME.accent} />
          <Text
            style={{ color: THEME.text, fontSize: 22, fontWeight: '800', marginLeft: 8 }}
            numberOfLines={1}
          >
           
          </Text>
        </View>

        <Pressable
          onPress={toggle}
          hitSlop={12}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: THEME.border,
            backgroundColor: pressed || open ? 'rgba(159,210,255,0.12)' : 'transparent',
            marginLeft: 12,
            gap: 8,
          })}
        >
          <Text style={{ color: THEME.textDim }} numberOfLines={1}>
            {greeting}
          </Text>
          <Feather name='menu' size={18} color={THEME.accent} />
        </Pressable>
      </Animated.View>

      {open ? (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={{
            backgroundColor: MENU_BG,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: THEME.border,
            marginTop: 8,
            overflow: 'hidden',
          }}
        >
          {menuItems.map((item) => {
            const disabled = item.action === 'logout' && loggingOut;
            const key =
              item.action ??
              (typeof item.href === 'string'
                ? item.href
                : item.href?.pathname ?? item.label);
            return (
              <Pressable
                key={key ?? item.label}
                onPress={() => handleSelect(item)}
                disabled={disabled}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 18,
                  backgroundColor: pressed ? 'rgba(159,210,255,0.12)' : 'transparent',
                  opacity: disabled ? 0.5 : 1,
                })}
              >
                <Feather name={item.icon} size={16} color={THEME.accent} />
                <Text style={{ color: THEME.text, marginLeft: 12, fontSize: 15 }}>
                  {item.action === 'logout' && loggingOut ? 'Cerrando sesión…' : item.label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>
      ) : null}
    </View>
  );
}
