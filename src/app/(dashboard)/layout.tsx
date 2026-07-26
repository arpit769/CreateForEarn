import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <Header />
      <main className="main-content">
        <div style={{ padding: '28px', maxWidth: '1440px' }}>
          {children}
        </div>
      </main>
    </>
  );
}
