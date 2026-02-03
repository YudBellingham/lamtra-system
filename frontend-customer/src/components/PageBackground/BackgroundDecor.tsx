import React, { useMemo } from 'react';
import { FaLeaf, FaSpa, FaPagelines, FaHeart } from 'react-icons/fa';
import { HiSparkles, HiOutlineSparkles } from 'react-icons/hi';
import './BackgroundDecor.css';

const BackgroundDecor: React.FC = () => {
  const iconTypes = [
    FaLeaf, FaSpa, HiSparkles, FaPagelines, HiOutlineSparkles, FaHeart
  ];
  const ITEM_COUNT = 40; 
  const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
  const randomPick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const decorItems = useMemo(() => {
    return Array.from({ length: ITEM_COUNT }).map((_, index) => {
      const IconComponent = randomPick(iconTypes);
      const sizeClass = randomPick(['size-s', 'size-m', 'size-l']);
      const speedClass = randomPick(['speed-slow', 'speed-medium', 'speed-fast']);
      const opacityClass = randomPick(['opacity-low', 'opacity-medium']);
      const style: React.CSSProperties = {
        top: `${randomRange(-10, 110)}vh`, 
        left: `${randomRange(-10, 110)}vw`,
        transform: `rotate(${randomRange(0, 360)}deg)`,
        animationDelay: `-${randomRange(0, 20)}s`, 
      };

      return (
        <div 
          key={index} 
          className={`decor-item ${sizeClass} ${speedClass} ${opacityClass}`}
          style={style}
        >
          <IconComponent />
        </div>
      );
    });
  }, []);

  return (
    <div className="background-decor-container">
      {decorItems}
    </div>
  );
};

export default BackgroundDecor;