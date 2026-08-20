import {
  Route,
  Routes,
} from "react-router-dom";

/* =====================================================
   HOME
===================================================== */

import HomePage from "./pages/HomePage";

/* =====================================================
   HOST FLOW
===================================================== */

import CreateRoomPage from "./pages/CreateRoomPage";
import ShareRoomPage from "./pages/ShareRoomPage";
import RoomStatusPage from "./pages/RoomStatusPage";
import CalculationLoadingPage from "./pages/CalculationLoadingPage";
import ResultPage from "./pages/ResultPage";
import ConfirmedRoomPage from "./pages/ConfirmedRoomPage";

/* =====================================================
   PARTICIPANT FLOW
===================================================== */

import JoinRoomPage from "./pages/JoinRoomPage";
import ParticipantWaitingPage from "./pages/ParticipantWaitingPage";
import ParticipantConfirmedPage from "./pages/ParticipantConfirmedPage";

/* =====================================================
   QUICK FLOW
===================================================== */

import QuickPage from "./pages/QuickPage";
import QuickOriginsPage from "./pages/QuickOriginsPage";
import QuickLoadingPage from "./pages/QuickLoadingPage";
import QuickResultPage from "./pages/QuickResultPage";
import QuickConfirmedPage from "./pages/QuickConfirmedPage";

/* =====================================================
   APP
===================================================== */

function App() {
  return (
    <Routes>
      {/* ===============================================
          HOME
      =============================================== */}

      <Route
        path="/"
        element={<HomePage />}
      />

      {/* ===============================================
          HOST FLOW
      =============================================== */}

      <Route
        path="/create"
        element={<CreateRoomPage />}
      />

      <Route
        path="/room/:roomId/share"
        element={<ShareRoomPage />}
      />

      <Route
        path="/room/:roomId/status"
        element={<RoomStatusPage />}
      />

      <Route
        path="/room/:roomId/loading"
        element={<CalculationLoadingPage />}
      />

      <Route
        path="/room/:roomId/result"
        element={<ResultPage />}
      />

      <Route
        path="/room/:roomId/confirmed"
        element={<ConfirmedRoomPage />}
      />

      {/* ===============================================
          PARTICIPANT FLOW
      =============================================== */}

      <Route
        path="/join/:inviteCode"
        element={<JoinRoomPage />}
      />

      <Route
        path="/join/:inviteCode/waiting"
        element={<ParticipantWaitingPage />}
      />

      <Route
        path="/join/:inviteCode/confirmed"
        element={<ParticipantConfirmedPage />}
      />

      {/* ===============================================
          QUICK FLOW
      =============================================== */}

      <Route
        path="/quick"
        element={<QuickPage />}
      />

      <Route
        path="/quick/origins"
        element={<QuickOriginsPage />}
      />

      <Route
        path="/quick/loading"
        element={<QuickLoadingPage />}
      />

      <Route
        path="/quick/result"
        element={<QuickResultPage />}
      />

      <Route
        path="/quick/confirmed"
        element={<QuickConfirmedPage />}
      />
    </Routes>
  );
}

export default App;