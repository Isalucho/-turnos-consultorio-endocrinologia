import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

import { CLINIC_NAME, emailStyles } from "./components";

type Props = {
  patientName: string;
  resetUrl: string;
};

export default function PasswordResetEmail({ patientName, resetUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Restablecé tu contraseña en {CLINIC_NAME}</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.heading}>Restablecer contraseña</Heading>
          <Text style={emailStyles.text}>Hola {patientName},</Text>
          <Text style={emailStyles.text}>
            Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el botón para
            elegir una nueva. Este link vence en 1 hora.
          </Text>
          <Button href={resetUrl} style={emailStyles.button}>
            Elegir nueva contraseña
          </Button>
          <Text style={emailStyles.text}>
            Si vos no pediste este cambio, podés ignorar este email: tu contraseña actual sigue
            funcionando.
          </Text>
          <Text style={emailStyles.footer}>{CLINIC_NAME}</Text>
        </Container>
      </Body>
    </Html>
  );
}
