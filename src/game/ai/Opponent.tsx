import React from 'react';
import { Vehicle } from '../vehicle/Vehicle';
import { AIController } from './AIController';

interface OpponentProps {
  controller: AIController;
}

export const Opponent: React.FC<OpponentProps> = ({ controller }) => {
  return (
    <Vehicle
      physics={controller.physics}
      vehicleId={controller.physics.config.id}
      customization={controller.personality.customization}
      isNitroActive={controller.physics.nitro.isActive}
    />
  );
};
