import { BrowserRouter } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

export default function App() {
    return (
        <BrowserRouter>
            <MainLayout />
        </BrowserRouter>
    );
}
