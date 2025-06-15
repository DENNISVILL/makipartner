import React from 'react';
import { Card, CardBody, CardHeader, Input, Button, Select, SelectItem } from '@heroui/react';
import { Icon } from '@iconify/react';

export const EditProfile: React.FC = () => {
  const [name, setName] = React.useState('Dennis');
  const [email, setEmail] = React.useState('dennisvega9876@outlook.com');
  const [phone, setPhone] = React.useState('+593');
  const [company, setCompany] = React.useState('');
  const [taxId, setTaxId] = React.useState('');
  const [street, setStreet] = React.useState('');
  const [apartment, setApartment] = React.useState('');
  const [zipCode, setZipCode] = React.useState('');
  const [city, setCity] = React.useState('Riobamba');
  const [country, setCountry] = React.useState('Ecuador');
  const [state, setState] = React.useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Profile updated:', {
      name,
      email,
      phone,
      company,
      taxId,
      street,
      apartment,
      zipCode,
      city,
      country,
      state
    });
    // Implementar lógica para guardar los datos
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Editar perfil</h1>
        
        <Card className="border border-divider">
          <CardBody className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    label="Nombre completo *"
                    placeholder="Tu nombre"
                    value={name}
                    onValueChange={setName}
                    variant="bordered"
                    radius="sm"
                    isRequired
                  />
                </div>
                
                <div>
                  <Input
                    type="email"
                    label="Correo electrónico *"
                    placeholder="nombre@empresa.com"
                    value={email}
                    onValueChange={setEmail}
                    variant="bordered"
                    radius="sm"
                    isRequired
                  />
                </div>
                
                <div>
                  <Input
                    type="tel"
                    label="Teléfono *"
                    placeholder="+593"
                    value={phone}
                    onValueChange={setPhone}
                    variant="bordered"
                    radius="sm"
                    isRequired
                  />
                </div>
                
                <div>
                  <Input
                    type="text"
                    label="Nombre de la empresa"
                    placeholder="Tu empresa"
                    value={company}
                    onValueChange={setCompany}
                    variant="bordered"
                    radius="sm"
                  />
                </div>
                
                <div>
                  <Input
                    type="text"
                    label="Número de identificación fiscal"
                    placeholder="NIF/CIF/RUC"
                    value={taxId}
                    onValueChange={setTaxId}
                    variant="bordered"
                    radius="sm"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    label="Número y calle *"
                    placeholder="Dirección"
                    value={street}
                    onValueChange={setStreet}
                    variant="bordered"
                    radius="sm"
                    isRequired
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    label="Departamento, suite, etc."
                    placeholder="Información adicional"
                    value={apartment}
                    onValueChange={setApartment}
                    variant="bordered"
                    radius="sm"
                  />
                </div>
                
                <div>
                  <Input
                    type="text"
                    label="Código postal *"
                    placeholder="Código postal"
                    value={zipCode}
                    onValueChange={setZipCode}
                    variant="bordered"
                    radius="sm"
                    isRequired
                  />
                </div>
                
                <div>
                  <Input
                    type="text"
                    label="Ciudad *"
                    placeholder="Ciudad"
                    value={city}
                    onValueChange={setCity}
                    variant="bordered"
                    radius="sm"
                    isRequired
                  />
                </div>
                
                <div>
                  <Select
                    label="País *"
                    placeholder="Selecciona un país"
                    selectedKeys={[country]}
                    onChange={(e) => setCountry(e.target.value)}
                    variant="bordered"
                    radius="sm"
                  >
                    <SelectItem key="Ecuador">Ecuador</SelectItem>
                    <SelectItem key="Colombia">Colombia</SelectItem>
                    <SelectItem key="Perú">Perú</SelectItem>
                    <SelectItem key="México">México</SelectItem>
                    <SelectItem key="España">España</SelectItem>
                  </Select>
                </div>
                
                <div>
                  <Select
                    label="Estado/Provincia *"
                    placeholder="Estado o provincia..."
                    selectedKeys={state ? [state] : []}
                    onChange={(e) => setState(e.target.value)}
                    variant="bordered"
                    radius="sm"
                  >
                    <SelectItem key="Pichincha">Pichincha</SelectItem>
                    <SelectItem key="Guayas">Guayas</SelectItem>
                    <SelectItem key="Azuay">Azuay</SelectItem>
                    <SelectItem key="Chimborazo">Chimborazo</SelectItem>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <p className="text-sm text-foreground-500 mb-4">
                    Usted elige cómo quiere que enviemos las facturas y en qué formato electrónico.
                  </p>
                  
                  <div className="flex justify-between mt-4">
                    <Button
                      color="primary"
                      variant="flat"
                      startContent={<Icon icon="lucide:trash-2" />}
                    >
                      Descartar
                    </Button>
                    
                    <Button
                      type="submit"
                      color="primary"
                      endContent={<Icon icon="lucide:arrow-right" />}
                    >
                      Guardar dirección
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};