// import logo from './logo.svg';
import "./App.css";
import Home from "./pages/home";
import Login from "./pages/Login";
import AttorneyRegister from "./pages/AttorneyRegister";
import AttorneyLogin from "./pages/AttorneyLogin";
import AttorneySignup from "./pages/AttorneySignup";
import AttorneyForgotPassword from "./pages/AttorneyForgotPassword";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Register from "./pages/Register";
import AttorneyDetailsForm from "./pages/AttorneyDetailsForm";
import AttorneyDashboard from "./pages/AttorneyDashboard";
import AttorneyProfile from "./pages/DoctorProfile";
import AttorneyAppointments from "./pages/AttorneyAppointments";
import ClientDashboard from "./pages/ClientDashboard";
import ClientProfile from "./pages/ClientProfile";
import ClientAppointments from "./pages/ClientAppointments";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AttorneyListing from "./pages/AttorneyListing";
import BookAppointment from "./pages/BookAppointment";
import PublicAttorneyProfile from "./pages/PublicAttorneyProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminAppointments from "./pages/AdminAppointments";
import AdminPatients from "./pages/AdminPatients";
import AdminDoctors from "./pages/AdminDoctors";
import AdminFeedback from "./pages/AdminFeedback";
import AdminServices from "./pages/AdminServices";
import AdminLabTestBookings from "./pages/AdminLabTestBookings";
import ClientConsultation from "./pages/ClientConsultation";
import AttorneyConsultation from "./pages/AttorneyConsultation";
import AIAdvisor from "./pages/AIAdvisor";
import AdminConsultations from "./pages/AdminConsultations";
import ClientFeedback from "./pages/ClientFeedback";
import ForgotPassword from "./pages/ForgotPassword";
import LabTestListing from "./pages/LabTestListing";
import BookLabTest from "./pages/BookLabTest";
import ClientLabTests from "./pages/ClientLabTests";
import Services from "./pages/Services";
import GoogleCallback from "./pages/GoogleCallback";
import ProfileRedirect from "./pages/ProfileRedirect";

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/attorney-register" element={<AttorneyRegister />} />
        <Route path="/attorney-login" element={<AttorneyLogin />} />
        <Route path="/attorney-signup" element={<AttorneySignup />} />
        <Route path="/attorney/signup" element={<AttorneySignup />} />
        <Route path="/attorney-forgot-password" element={<AttorneyForgotPassword />} />
        <Route path="/attorney" element={<Navigate to="/attorney-login" replace />} />
        <Route path="/user" element={<GoogleCallback />} />
        <Route path="/profile" element={<ProfileRedirect />} />
        <Route path="/attorney/details" element={<AttorneyDetailsForm />} />
        <Route path="/attorney/dashboard" element={<AttorneyDashboard />} />
        <Route path="/attorney/profile" element={<AttorneyProfile />} />
        <Route path="/attorney/appointments" element={<AttorneyAppointments />} />
        <Route path="/attorney/consultation" element={<AttorneyConsultation />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/profile" element={<ClientProfile />} />
        <Route path="/client/appointments" element={<ClientAppointments/>} />
        <Route path="/client/feedback" element={<ClientFeedback/>} />
        <Route path="/client/lab-tests" element={<ClientLabTests/>} />
        <Route path="/client/consultation" element={<ClientConsultation/>} />
        <Route path="/services" element={<Services/>} />
        <Route path="/lab-tests" element={<LabTestListing/>} />
        <Route path="/book-lab-test/:testId" element={<BookLabTest/>} />
        <Route path="/about" element={<About/>} />
        <Route path="/contact" element={<Contact/>} />
        <Route path="/attorneys" element={<AttorneyListing/>} />
        <Route path="/book-appointment/:attorneyId" element={<BookAppointment/>} />
        <Route path="/attorney-profile/:attorneyId" element={<PublicAttorneyProfile/>} />
        <Route path="/admin" element={<AdminLogin/>} />
        <Route path="/admin/dashboard" element={
          <ProtectedAdminRoute>
            <AdminDashboard/>
          </ProtectedAdminRoute>
        } />
        <Route path="/admin/appointments" element={
          <ProtectedAdminRoute>
            <AdminAppointments/>
          </ProtectedAdminRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedAdminRoute>
            <AdminPatients/>
          </ProtectedAdminRoute>
        } />
        <Route path="/admin/doctors" element={
          <ProtectedAdminRoute>
            <AdminDoctors/>
          </ProtectedAdminRoute>
        } />
        <Route path="/admin/feedback" element={
          <ProtectedAdminRoute>
            <AdminFeedback/>
          </ProtectedAdminRoute>
        } />
        <Route path="/admin/services" element={
          <ProtectedAdminRoute>
            <AdminServices/>
          </ProtectedAdminRoute>
        } />
        <Route path="/admin/lab-test-bookings" element={
          <ProtectedAdminRoute>
            <AdminLabTestBookings/>
          </ProtectedAdminRoute>
        } />
        <Route path="/admin/consultations" element={
          <ProtectedAdminRoute>
            <AdminConsultations/>
          </ProtectedAdminRoute>
        } />
        <Route path="/ai-advisor" element={<AIAdvisor/>} />

      </Routes>
    </Router>
  );
}

export default App;