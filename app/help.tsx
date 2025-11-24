import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import { THEME } from '../src/theme';
import AppNavbar from '../src/components/AppNavbar';
import { MENU_ITEMS } from '../src/constants/menu';

export default function HelpScreen() {
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    return (
        <View style={{ flex: 1, backgroundColor: THEME.bgTop }}>
            <AppNavbar title="Ayuda" menuItems={MENU_ITEMS} onLogout={handleLogout} />
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Card title="Acerca de PopliCuentos">
                    <Text style={{ color: THEME.textDim, lineHeight: 22, marginBottom: 16 }}>
                        PopliCuentos es una aplicación diseñada para crear historias mágicas y personalizadas para niños.
                        Utilizamos inteligencia artificial para generar cuentos únicos basados en tus preferencias.
                    </Text>
                    <Text style={{ color: THEME.text, fontWeight: 'bold', marginBottom: 4 }}>Empresa:</Text>
                    <Text style={{ color: THEME.textDim, marginBottom: 16 }}>PopliCuentos Inc.</Text>

                    <Text style={{ color: THEME.text, fontWeight: 'bold', marginBottom: 4 }}>Versión:</Text>
                    <Text style={{ color: THEME.textDim, marginBottom: 16 }}>1.0.0</Text>
                </Card>

                <View style={{ height: 16 }} />

                <Card title="Preguntas Frecuentes">
                    <FaqItem
                        question="¿Cómo creo un cuento?"
                        answer="Ve a 'Inicio' (Generador), selecciona la edad, el tema y los valores que deseas, y presiona 'Crear Cuento'."
                    />
                    <FaqItem
                        question="¿Puedo guardar los cuentos?"
                        answer="Sí, los cuentos se guardan automáticamente en tu historial reciente."
                    />
                    <FaqItem
                        question="¿Es gratuito?"
                        answer="Tienes un número limitado de cuentos gratuitos por día. Para más, consulta nuestros planes."
                    />
                </Card>
            </ScrollView>
        </View>
    );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [expanded, setExpanded] = React.useState(false);

    return (
        <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            style={{ borderBottomWidth: 1, borderBottomColor: THEME.border, paddingVertical: 12 }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: THEME.text, fontWeight: '600', flex: 1, paddingRight: 8 }}>{question}</Text>
                <Feather name={expanded ? "chevron-up" : "chevron-down"} size={20} color={THEME.textDim} />
            </View>
            {expanded && (
                <Text style={{ color: THEME.textDim, marginTop: 8, lineHeight: 20 }}>
                    {answer}
                </Text>
            )}
        </TouchableOpacity>
    );
}
