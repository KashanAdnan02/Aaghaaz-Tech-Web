import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import routes from './routes';

// Import your components here
import Login from './pages/Login';
import Register from './pages/Register';
import Course from './pages/Course';
import Attendance from './pages/Attendance';
import Unauthorized from './pages/Unauthorized';
import Students from './pages/Students';
import Home from './pages/Home';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={'loading...'} persistor={persistor}>
        <Router>
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            {routes.map((route) => {
              // Create the element with the component
              let element = <route.component />;
              
              // Wrap with Layout if needed
              if (route.layout) {
                element = <Layout>{element}</Layout>;
              }
              
              // Wrap with ProtectedRoute if it has allowedRoles
              if (route.allowedRoles) {
                element = (
                  <ProtectedRoute allowedRoles={route.allowedRoles}>
                    {element}
                  </ProtectedRoute>
                );
              }
              
              return (
                <Route 
                  key={route.path}
                  path={route.path}
                  element={element}
                  exact={route.exact}
                />
              );
            })}
            
            {/* Redirect to login if no route matches */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;
