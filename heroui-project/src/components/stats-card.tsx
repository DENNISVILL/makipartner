import React from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = "primary",
  buttonText,
  onButtonClick
}) => {
  return (
    <Card className="border border-divider h-full">
      <CardBody className="p-5">
        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-foreground-500 mb-1">{title}</h3>
          <div className="flex items-end gap-2 mb-1">
            <span className={`text-3xl font-bold text-${color}`}>{value}</span>
            {subtitle && <span className="text-xs text-foreground-400 mb-1">{subtitle}</span>}
          </div>
          
          {buttonText && (
            <Button
              size="sm"
              color={color as any}
              variant="flat"
              radius="sm"
              className="mt-3"
              onPress={onButtonClick}
            >
              {buttonText}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};