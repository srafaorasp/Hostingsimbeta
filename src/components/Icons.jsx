import React from 'react';
import { useDrag } from 'react-dnd';
import useGameStore from '../store/gameStore';

const ItemTypes = {
  ICON: 'icon',
};

const DesktopIcon = ({ id, app, initialPosition, onDoubleClick }) => {
  const { updateIconPosition } = useGameStore.getState();
  const IconComponent = app.icon;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.ICON,
    item: { id },
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        const left = Math.round(initialPosition.x + delta.x);
        const top = Math.round(initialPosition.y + delta.y);
        updateIconPosition(item.id, { x: left, y: top });
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [id, initialPosition, updateIconPosition]);

  return (
    <div
      ref={drag}
      style={{
        position: 'absolute',
        left: `${initialPosition.x}px`,
        top: `${initialPosition.y}px`,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'pointer',
      }}
      className="flex flex-col items-center w-24 p-2 text-center rounded hover:bg-blue-500 hover:bg-opacity-50"
      onDoubleClick={onDoubleClick}
    >
      <IconComponent className="w-12 h-12 mb-1" />
      <span className="text-white text-sm shadow-black" style={{ textShadow: '1px 1px 2px black' }}>
        {app.title}
      </span>
    </div>
  );
};

export default DesktopIcon;

