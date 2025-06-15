import React from 'react';
import { Card, CardBody, Input, Button, Link, Checkbox, Divider } from '@heroui/react';
import { Link as RouteLink } from 'react-router-dom';
import { Icon } from '@iconify/react';

export const Signup: React.FC = () => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [acceptTerms, setAcceptTerms] = React.useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Signup with:', { name, email, password, company, phone, acceptTerms });
    // Implementar lógica de registro
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-content2">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-primary text-4xl font-bold mb-2">odoo</div>
          <h2 className="text-2xl font-bold">Crear una cuenta</h2>
          <p className="text-foreground-500">Comienza tu prueba gratuita de 15 días</p>
        </div>

        <Card className="border border-divider">
          <CardBody className="p-6">
            <form onSubmit={handleSignup} className="space-y-5">
              <Input
                type="text"
                label="Nombre completo"
                placeholder="Tu nombre"
                value={name}
                onValueChange={setName}
                variant="bordered"
                radius="sm"
                isRequired
              />
              
              <Input
                type="email"
                label="Correo electrónico"
                placeholder="nombre@empresa.com"
                value={email}
                onValueChange={setEmail}
                variant="bordered"
                radius="sm"
                isRequired
              />
              
              <Input
                type="password"
                label="Contraseña"
                placeholder="Crea una contraseña segura"
                value={password}
                onValueChange={setPassword}
                variant="bordered"
                radius="sm"
                isRequired
                endContent={
                  <button type="button" className="focus:outline-none">
                    <Icon icon="lucide:eye" className="text-foreground-400" />
                  </button>
                }
              />
              
              <Input
                type="text"
                label="Nombre de la empresa"
                placeholder="Tu empresa"
                value={company}
                onValueChange={setCompany}
                variant="bordered"
                radius="sm"
                isRequired
              />
              
              <Input
                type="tel"
                label="Teléfono"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onValueChange={setPhone}
                variant="bordered"
                radius="sm"
                isRequired
              />
              
              <Checkbox 
                isSelected={acceptTerms}
                onValueChange={setAcceptTerms}
                size="sm"
              >
                <span className="text-sm">
                  Acepto los{' '}
                  <Link href="#" color="primary" size="sm">
                    Términos y Condiciones
                  </Link>
                  {' '}y la{' '}
                  <Link href="#" color="primary" size="sm">
                    Política de Privacidad
                  </Link>
                </span>
              </Checkbox>
              
              <Button 
                type="submit" 
                color="primary" 
                className="w-full" 
                radius="sm"
                isDisabled={!acceptTerms}
              >
                Crear cuenta
              </Button>
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <Divider className="my-4" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-content1 px-2 text-sm text-foreground-500">
                    o regístrate con
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button 
                  variant="bordered" 
                  radius="sm"
                  startContent={<Icon icon="logos:google-icon" width={18} height={18} />}
                >
                  Google
                </Button>
                <Button 
                  variant="bordered" 
                  radius="sm"
                  startContent={<Icon icon="logos:microsoft-icon" width={18} height={18} />}
                >
                  Microsoft
                </Button>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-sm text-foreground-500">
                ¿Ya tienes una cuenta?{' '}
                <Link as={RouteLink} to="/login" color="primary">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};