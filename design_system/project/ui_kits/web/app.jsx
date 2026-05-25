/* =========================================================
   2chi · Web UI Kit — App router (the actual product mock)
   States: onboarding → dashboard ↔ cover-letter ↔ posting
========================================================= */

function App() {
  // Default landing is dashboard — onboarding is the first-time path users
  // hit via the "Restart onboarding" link below.
  const [route, setRoute] = useState("dash");
  const [completedOnb, setCompletedOnb] = useState(false);

  const showNav = route !== "onb" && route !== "login" && route !== "signup" && route !== "reset" && route !== "verify" && route !== "404" && route !== "500";

  let body;
  if (route === "onb") {
    body = (
      <OnboardingScreen
        onComplete={() => { setCompletedOnb(true); setRoute("dash"); }}
      />
    );
  } else if (route === "cl") {
    body = <CoverLettersScreen onOpenEditor={() => setRoute("cl-editor")}/>;
  } else if (route === "cl-editor") {
    body = <CoverLetterScreen/>;
  } else if (route === "posting") {
    body = <CompanyScreen/>;
  } else if (route === "me") {
    body = <MeScreen/>;
  } else if (route === "apps") {
    body = <ApplicationsScreen/>;
  } else if (route === "login") {
    body = <AccountScreen initialView="login" onAuthed={() => setRoute("dash")}/>;
  } else if (route === "signup") {
    body = <AccountScreen initialView="signup" onAuthed={() => setRoute("dash")}/>;
  } else if (route === "mypage") {
    body = <AccountScreen initialView="mypage"/>;
  } else if (route === "reset") {
    body = <AccountScreen initialView="reset"/>;
  } else if (route === "verify") {
    body = <AccountScreen initialView="verify"/>;
  } else if (route === "404") {
    body = <ErrorScreen code={404} onHome={() => setRoute("dash")}/>;
  } else if (route === "500") {
    body = <ErrorScreen code={500} onHome={() => setRoute("dash")}/>;
  } else {
    body = <DashboardScreen onNavigate={setRoute} completedOnb={completedOnb}/>;
  }

  return (
    <>
      {showNav && (
        <TopNav
          current={
            route === "cl"        ? "job" :
            route === "cl-editor" ? "job" :
            route === "posting"   ? "co"  :
            route === "me"        ? "me"  :
            route === "apps"      ? "apps" :
            "home"
          }
          onNavigate={(id) => {
            if (id === "home") setRoute("dash");
            else if (id === "me")     setRoute("me");
            else if (id === "job")    setRoute("cl");
            else if (id === "co")     setRoute("posting");
            else if (id === "apps")   setRoute("apps");
            else if (id === "mypage") setRoute("mypage");
            else setRoute("dash");
          }}
        />
      )}
      {body}

      {/* Small dev toggle so a reviewer can jump between unauthenticated and
          authenticated flows from anywhere. Lives in the corner; styled lightly. */}
      {route !== "onb" && route !== "login" && route !== "signup" && (
        <>
          <button
            onClick={() => setRoute("login")}
            style={{
              position: "fixed", right: 200, bottom: 24, zIndex: 60,
              padding: "10px 14px", borderRadius: "999px",
              background: "var(--color-neutral-700)", color: "#fff",
              border: "none", fontFamily: "var(--font-family-mono)",
              fontSize: 11, letterSpacing: "0.06em", fontWeight: 700,
              cursor: "pointer", boxShadow: "var(--shadow-floating)",
            }}
          >LOGIN · SIGNUP</button>
          <button
            onClick={() => setRoute("mypage")}
            style={{
              position: "fixed", right: 24, bottom: 24, zIndex: 60,
              padding: "10px 14px", borderRadius: "999px",
              background: "var(--color-neutral-700)", color: "#fff",
              border: "none", fontFamily: "var(--font-family-mono)",
              fontSize: 11, letterSpacing: "0.06em", fontWeight: 700,
              cursor: "pointer", boxShadow: "var(--shadow-floating)",
              marginRight: 110,
            }}
          >MYPAGE</button>
          <button
            onClick={() => setRoute("onb")}
            style={{
              position: "fixed", right: 24, bottom: 24, zIndex: 60,
              padding: "10px 14px", borderRadius: "999px",
              background: "var(--color-neutral-800)", color: "#fff",
              border: "none", fontFamily: "var(--font-family-mono)",
              fontSize: 11, letterSpacing: "0.06em", fontWeight: 700,
              cursor: "pointer", boxShadow: "var(--shadow-floating)",
            }}
          >ONBOARDING</button>
        </>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
