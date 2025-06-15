import React from 'react';
import { Card, CardBody } from '@heroui/react';
import { Link as RouteLink } from 'react-router-dom';
import { Icon } from '@iconify/react';

interface AccountCardProps {
  icon: string;
  title: string;
  description: string;
  to: string;
  iconColor?: string;
}

export const AccountCard: React.FC<AccountCardProps> = ({ 
  icon, 
  title, 
  description, 
  to,
  iconColor = "text-primary" 
}) => {
  return (
    <Card 
      as={RouteLink} 
      to={to}
      isPressable
      disableRipple
      className="odoo-card border border-divider h-full"
    >
      <CardBody className="flex flex-col gap-2 p-6">
        <div className={`${iconColor} mb-2`}>
          <Icon icon={icon} width={28} height={28} />
        </div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-foreground-500">{description}</p>
      </CardBody>
    </Card>
  );
};