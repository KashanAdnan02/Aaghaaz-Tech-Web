import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import ProtectedRoute from './components/ProtectedRoute';

import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import routes from './routes';


function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={'loading...'} persistor={persistor}>
        <Router>

          <Routes>
            {routes.map((route) => {
              // Create the element with the component
              let element = <route.component />;

              // Wrap with Layout if needed
              if (route.layout) {
                element = <Layout>{element}</Layout>;
              }

              // Wrap with ProtectedRoute for both public and protected routes
              element = (
                <ProtectedRoute
                  isPublic={route.public}
                  allowedRoles={route.allowedRoles}
                >
                  {element}
                </ProtectedRoute>
              );

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
