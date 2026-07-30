import LandingPage from "../components/pages/LandingPage";
import DemoLoader from "../components/pages/DemoLoader";
import AppLoader from "../components/pages/AppLoader";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; loaded?: string }>;
}) {
  const { demo, loaded } = await searchParams;
  if (!demo) return <LandingPage />;
  // After a successful load, DemoLoader navigates to /?demo=<name>&loaded=1.
  // AppLoader shows a spinner until the Layout has finished reading localStorage,
  // then renders the app. This prevents flashing default config.
  if (loaded === "1") return <AppLoader />;
  return <DemoLoader demo={demo} />;
}
