import MobileApp from './pages/mobile/MobileApp';
import PcApp from './pages/pc/PcApp';
import { isMobile } from './utils';

const App = () => {
    return isMobile() ? <MobileApp /> : <PcApp />;
};

export default App;
