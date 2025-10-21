import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GenerateLessons from './pages/GenerateLessons';
import ViewLesson from './pages/ViewLesson';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GenerateLessons />} />
        <Route path="/lessons/:id" element={<ViewLesson />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
