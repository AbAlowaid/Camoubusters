# Detection Reports - SOC Dashboard

## Overview

The Detection Reports page is a comprehensive Security Operations Center (SOC) dashboard designed for security analysts to monitor, investigate, and respond to security detections in real-time.

## Features

### 🎯 Key Performance Indicators (KPIs)
- **Total Detections**: Animated counter with trend indicators
- **Critical Alerts**: Highlighted critical security events
- **Mean Time to Detect (MTTD)**: Performance metric for detection speed
- **Mean Time to Respond (MTTR)**: Performance metric for response time
- **Alerts by Status**: Interactive donut chart showing alert distribution

### 📊 Interactive Visualizations
- **Detections Over Time**: Line chart showing detection trends by severity
  - Clickable severity toggles
  - Interactive time points for filtering
  - Real-time data updates
- **Top MITRE ATT&CK Tactics**: Bar chart showing most common attack techniques
  - Clickable bars for tactic-based filtering
  - Color-coded severity indicators

### 📋 Advanced Detection Table
- **Comprehensive Filtering**: By status, severity, and search terms
- **Dynamic Sorting**: Click column headers to sort by any field
- **Real-time Search**: Instant filtering across all detection fields
- **Interactive Rows**: Click any row to open detailed investigation view

### 🔍 Detailed Investigation Modal
- **Multi-tab Interface**: Overview, Raw Logs, and Remediation tabs
- **Quick Actions**: Update status and assignee directly from the modal
- **Timeline View**: Visual timeline of detection events
- **Raw Log Analysis**: Formatted log entries for forensic analysis
- **Remediation Guidance**: Step-by-step response recommendations

## Components Structure

```
DetectionReports/
├── page.tsx                 # Main page component
├── KPICards.tsx            # KPI metrics cards
├── DetectionCharts.tsx     # Interactive charts
├── DetectionTable.tsx      # Main detection table
├── DetectionModal.tsx      # Drill-down investigation modal
└── TimeRangeFilter.tsx     # Time range selector
```

## Usage

1. **Navigate** to `/detection-reports` from the main navigation
2. **Select Time Range** using the filter in the top-right corner
3. **Monitor KPIs** in the top row for at-a-glance security posture
4. **Analyze Trends** using the interactive charts
5. **Investigate Detections** by clicking on table rows
6. **Take Action** using quick actions in the investigation modal

## Data Structure

The page uses mock data that follows this structure:

```typescript
interface DetectionEvent {
  id: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  timestamp: string
  alertName: string
  entity: string
  sourceIP: string
  destinationIP: string
  mitreTactic: string
  status: 'New' | 'In Progress' | 'Closed - False Positive' | 'Closed - Remediated'
  assignee: string
  description: string
  rawLogs: string[]
  remediationSteps: string[]
}
```

## Integration Notes

- **Mock Data**: Currently uses generated mock data for demonstration
- **API Ready**: Components are structured to easily integrate with real backend APIs
- **Responsive Design**: Optimized for desktop SOC environments
- **Accessibility**: Built with keyboard navigation and screen reader support

## Future Enhancements

- Real-time WebSocket updates
- Advanced filtering and search capabilities
- Export functionality for reports
- Integration with SIEM systems
- Customizable dashboard layouts
- Alert correlation and grouping
- Automated response workflows

## Technical Details

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom professional theme
- **State Management**: React hooks for local state
- **Charts**: Custom SVG-based visualizations
- **Modals**: Custom modal implementation with backdrop
- **Animations**: CSS transitions and custom animations





