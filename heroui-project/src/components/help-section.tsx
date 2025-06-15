import React from 'react';
import { Card, CardBody, Input, Button } from '@heroui/react';
import { Icon } from '@iconify/react';

export const HelpSection: React.FC = () => {
  const [question, setQuestion] = React.useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitted question:', question);
    // Implementar lógica para enviar la pregunta
    setQuestion('');
  };
  
  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-8">
          ¿Necesita ayuda?
          <span className="block h-1 w-24 bg-primary mx-auto mt-2"></span>
        </h2>
        
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <Card className="flex-1 border border-divider">
            <CardBody className="p-6">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Pregúntale a la IA de Odoo"
                  value={question}
                  onValueChange={setQuestion}
                  variant="bordered"
                  radius="sm"
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  isIconOnly
                  color="primary"
                  radius="sm"
                >
                  <Icon icon="lucide:send" />
                </Button>
              </form>
            </CardBody>
          </Card>
          
          <div className="flex-none">
            <Button 
              color="primary" 
              variant="solid"
              radius="sm"
              size="lg"
            >
              Submit a Ticket
            </Button>
          </div>
        </div>
        
        <h2 className="text-4xl font-bold text-center mb-8">
          Contáctenos
          <span className="block h-1 w-24 bg-primary mx-auto mt-2"></span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-divider">
            <CardBody className="p-4 text-center">
              <Button 
                variant="light" 
                color="primary"
                className="mb-2 mx-auto"
              >
                Contacta a un consultor
              </Button>
            </CardBody>
          </Card>
          
          <Card className="border border-divider">
            <CardBody className="p-4 text-center">
              <Button 
                variant="light" 
                color="primary"
                className="mb-2 mx-auto"
              >
                Solicita un desarrollo
              </Button>
            </CardBody>
          </Card>
          
          <Card className="border border-divider">
            <CardBody className="p-4 text-center">
              <Button 
                variant="light" 
                color="primary"
                className="mb-2 mx-auto"
              >
                Conviértete en partner
              </Button>
            </CardBody>
          </Card>
          
          <Card className="border border-divider">
            <CardBody className="p-4 text-center">
              <Button 
                variant="light" 
                color="primary"
                className="mb-2 mx-auto"
              >
                Reporta un bug
              </Button>
            </CardBody>
          </Card>
        </div>
        
        <Card className="mt-8 border border-divider">
          <CardBody className="p-6">
            <h3 className="text-xl font-bold mb-4">Llámenos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">América</p>
                <p className="text-foreground-500">+1 (650) 870 2051</p>
              </div>
              <div>
                <p className="font-medium">América Latina</p>
                <p className="text-foreground-500">+1 (650) 260 6552</p>
              </div>
              <div>
                <p className="font-medium">Europa</p>
                <p className="text-foreground-500">+32 2 616 80 02</p>
              </div>
              <div>
                <p className="font-medium">África</p>
                <p className="text-foreground-500">+254 207 640 404</p>
              </div>
              <div>
                <p className="font-medium">Medio Oriente</p>
                <p className="text-foreground-500">+971 4 498 7800</p>
              </div>
              <div>
                <p className="font-medium">Asia</p>
                <p className="text-foreground-500">+91 79 40 500 100</p>
              </div>
              <div>
                <p className="font-medium">Reino Unido</p>
                <p className="text-foreground-500">+44 161 3940780</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};