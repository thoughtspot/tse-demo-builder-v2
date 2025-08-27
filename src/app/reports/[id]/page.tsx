

interface ReportsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { id: reportId } = await params;

  return (
    <div>
        <div
          style={{
            backgroundColor: "#f7fafc",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Report Configuration
          </h2>

          <p
            style={{
              color: "#4a5568",
              lineHeight: "1.6",
              marginBottom: "16px",
            }}
          >
            This is a dynamic reports page for Report {reportId}. The content
            and configuration for this report will be populated based on the
            report ID and available data.
          </p>

          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              marginTop: "16px",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              Report Details
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <strong>Report ID:</strong> {reportId}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <span style={{ color: "#38a169" }}>Active</span>
              </div>
              <div>
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </div>
              <div>
                <strong>Type:</strong> Dynamic Report
              </div>
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <button
              style={{
                padding: "12px 24px",
                backgroundColor: "#3182ce",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginRight: "12px",
              }}
            >
              Generate Report
            </button>
            <button
              style={{
                padding: "12px 24px",
                backgroundColor: "white",
                color: "#4a5568",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Export Data
            </button>
          </div>
        </div>
      </div>
  );
}
