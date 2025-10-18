import { useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';

export const useGameLoop = () => {
  const { update, loggedIn, gameSpeed } = useGameStore();
  const lastTimeRef = useRef(performance.now());
  const gameLoopId = useRef(null);

  useEffect(() => {
    if (!loggedIn) {
      if (gameLoopId.current) {
        cancelAnimationFrame(gameLoopId.current);
        gameLoopId.current = null;
      }
      return;
    }

    const loop = (currentTime) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // in seconds
      lastTimeRef.current = currentTime;

      // Call the main update function from the store
      update(deltaTime);

      gameLoopId.current = requestAnimationFrame(loop);
    };

    gameLoopId.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopId.current) {
        cancelAnimationFrame(gameLoopId.current);
      }
    };
  }, [loggedIn, update, gameSpeed]);
};

