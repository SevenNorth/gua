import { useEffect, useState } from 'react';
import MobileApp from './pages/mobile/MobileApp';
import PcApp from './pages/pc/PcApp';
import { isMobile } from './utils';

const App = () => {
    const [mobile, setMobile] = useState(() => isMobile());

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const handleChange = () => setMobile(isMobile());

        handleChange();
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return mobile ? <MobileApp /> : <PcApp />;
};

export default App;
