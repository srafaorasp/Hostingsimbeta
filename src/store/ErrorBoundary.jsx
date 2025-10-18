import React from 'react';
import useGameStore from '../store/gameStore';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        
        // Trigger the global BSOD state
        const { triggerBSOD } = useGameStore.getState();
        triggerBSOD(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // A simple fallback until the BSOD screen takes over
            return <div className="fixed inset-0 bg-black text-red-500 flex items-center justify-center"><h1>Something went wrong.</h1></div>;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
