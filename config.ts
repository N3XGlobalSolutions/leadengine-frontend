
export const brandConfig = {
  // Identity
  companyName: "Sky Habitat Homes",
  shortName: "Sky Habitat",
  botName: "Q-Lead",
  botDisplayName: "Q-BOT", // Displayed in Navbar
  botAvatar: "https://cdn-icons-png.flaticon.com/512/4712/4712109.png", // Q-Bot image

  // Theme (For Tailwind classes - conceptually)
  colors: {
    primary: "blue", // Used for highlighting
    secondary: "indigo" // Used for buttons/accents
  },

  // Welcome Screen Content 
  welcome: {
    headline: "Welcome to",
    highlightedHeadline: "Sky Habitat Homes",
    subheadline: "Hi there! I'm Q-Lead, your personal AI real estate assistant. I can help check availability, pricing, and schedule tours for our premium properties.",
    startBtnText: "Start Conversation",
    features: ["Premium 2BHK", "Luxury 3BHK", "Whitefield"]
  },

  // Bot Logic & Scripts
  leadQualification: {
    // These contexts help the Quick Reply logic in App.tsx
    // The keys match the detection logic
    options: {
      locations: ["Whitefield", "Sarjapur Road", "Electronic City", "North Bangalore"],
      budgets: ["< ₹80 Lakhs", "₹80L - ₹1.2 Cr", "₹1.2 Cr - ₹2 Cr", "Flexible"],
      types: ["2 BHK", "2.5 BHK", "3 BHK", "Luxury 4 BHK"],
      moveIn: ["Ready to Move", "Within 3 Months", "6 Months", "Investment"],
      financing: ["Yes, need home loan", "No, self-funded"]
    },
    // Configurable questions for the bot flow
    questions: [
      {
        id: "contact",
        label: "Introduction & Contact",
        instruction: "Greet warmly, introduce the company, and ask for the user's **Name and Phone Number**.",
        collects: ["name", "phone"]
      },
      {
        id: "location",
        label: "Location",
        instruction: "Ask for their preferred location.",
        collects: ["location"],
        optionsKey: "locations"
      },
      {
        id: "budget",
        label: "Budget",
        instruction: "Ask for their budget range.",
        collects: ["budget"],
        optionsKey: "budgets"
      },
      {
        id: "type",
        label: "Type",
        instruction: "Ask for the apartment type (e.g., 2BHK, 3BHK).",
        collects: ["type"],
        optionsKey: "types"
      },
      {
        id: "moveIn",
        label: "Move-in",
        instruction: "Ask for their move-in timeline.",
        collects: ["moveIn"],
        optionsKey: "moveIn"
      },
      {
        id: "financing",
        label: "Financing",
        instruction: "Ask if they need home loan assistance.",
        collects: ["financing"],
        optionsKey: "financing"
      }
    ]
  },

  // Hardcoded Messages
  messages: {
    scheduleSuccess: "Fantastic! I've forwarded your details to our priority sales team. They will call you shortly to confirm the appointment. Have a great day!",
    maybeLater: "No problem! I've saved your preferences. Feel free to reach out whenever you're ready to visit Sky Habitat Homes."
  }
};
