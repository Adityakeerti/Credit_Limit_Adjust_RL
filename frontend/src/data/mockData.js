// Sample mock data structure - Replace with API calls in production
// This file demonstrates the expected data structure for the application

export const sampleMockData = {
  landing: {
    hero: {
      title: 'Modern Banking & Finance Platform',
      subtitle: 'Secure, Fast, and Transparent Financial Services'
    },
    statusCards: {
      approved: 1250,
      pending: 342,
      requested: 89
    },
    broadcasts: [
      {
        type: 'Announcement',
        date: '2024-01-15',
        title: 'New Features Available',
        message: 'We\'ve added new investment options and improved transaction processing speed.'
      },
      {
        type: 'System Update',
        date: '2024-01-14',
        title: 'Scheduled Maintenance',
        message: 'System maintenance completed successfully. All services are now operational.'
      }
    ]
  },
  dashboard: {
    broadcasts: [
      {
        priority: 'high',
        timestamp: '2024-01-15 10:30 AM',
        title: 'Important Security Update',
        message: 'Please update your security settings to ensure account protection.'
      },
      {
        priority: 'medium',
        timestamp: '2024-01-15 09:15 AM',
        title: 'New Investment Opportunity',
        message: 'Check out our latest high-yield investment options.'
      }
    ],
    portfolio: {
      totalAssets: 125000.50,
      walletBalance: 15234.75,
      investments: [
        { name: 'Tech Growth Fund', type: 'Mutual Fund', value: 45000 },
        { name: 'Real Estate Trust', type: 'REIT', value: 35000 },
        { name: 'Cryptocurrency Portfolio', type: 'Digital Assets', value: 25000 }
      ]
    }
  },
  transactions: [
    {
      actor: 'John Doe',
      preState: 10000,
      postState: 12500,
      reason: 'Investment Return',
      timestamp: '2024-01-15T10:30:00Z'
    },
    {
      actor: 'System',
      preState: 12500,
      postState: 12000,
      reason: 'Transaction Fee',
      timestamp: '2024-01-15T09:15:00Z'
    },
    {
      actor: 'Jane Smith',
      preState: 12000,
      postState: 15234.75,
      reason: 'Deposit',
      timestamp: '2024-01-14T14:20:00Z'
    }
  ],
  wallet: {
    totalAmount: 15234.75,
    creditScore: 745,
    growthData: [
      { date: '2024-01-01', increased: 10000, decreased: 0 },
      { date: '2024-01-05', increased: 11000, decreased: 500 },
      { date: '2024-01-10', increased: 12000, decreased: 1000 },
      { date: '2024-01-15', increased: 15234.75, decreased: 1200 }
    ]
  },
  banker: {
    lending: {
      opportunities: [
        { id: 1, amount: 50000, interest: 5.5 },
        { id: 2, amount: 75000, interest: 6.0 }
      ],
      loanAssets: [
        { name: 'Commercial Loan A', value: 250000 },
        { name: 'Residential Loan B', value: 180000 }
      ],
      status: [
        { label: 'Active Loans: 15' },
        { label: 'Pending Approvals: 3' },
        { label: 'Total Portfolio: $4.2M' }
      ]
    },
    assets: {
      overview: [
        { name: 'Total Assets', value: 5000000 },
        { name: 'Liquid Assets', value: 1200000 },
        { name: 'Invested Assets', value: 3800000 }
      ],
      currencies: [
        { code: 'USD', name: 'US Dollar', amount: 500000 },
        { code: 'EUR', name: 'Euro', amount: 250000 },
        { code: 'GBP', name: 'British Pound', amount: 150000 }
      ],
      digitalAssets: [
        { name: 'Bitcoin', symbol: 'BTC', amount: 2.5 },
        { name: 'Ethereum', symbol: 'ETH', amount: 15.8 }
      ]
    },
    transactions: [
      {
        type: 'Currency Exchange',
        date: '2024-01-15',
        from: 'USD',
        to: 'EUR',
        amount: 50000,
        summary: 'Large currency conversion for international client'
      },
      {
        type: 'Asset Transfer',
        date: '2024-01-14',
        from: 'Main Portfolio',
        to: 'Investment Fund',
        amount: 250000,
        summary: 'Asset reallocation for better returns'
      }
    ]
  }
}

// Helper function to initialize mock data in AppContext
export const initializeMockData = (updateMockData) => {
  Object.keys(sampleMockData).forEach(section => {
    updateMockData(section, sampleMockData[section])
  })
}

