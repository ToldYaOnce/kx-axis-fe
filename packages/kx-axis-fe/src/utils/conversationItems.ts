import industryConfig from '../config/industryConversationItems.json';

export interface ConversationItem {
  id: string;
  type: string;  // Backend expects 'type', not 'kind'
  title: string;
  description: string;
  icon?: string;
  badge?: string;
}

export const INDUSTRIES = industryConfig.industries;

/**
 * Get all available conversation items for a specific industry
 * Returns: general items (always available) + industry-specific items
 */
export function getConversationItemsForIndustry(industry?: string): ConversationItem[] {
  const generalItems = industryConfig.generalItems as ConversationItem[];
  
  if (!industry || industry === 'Other') {
    return generalItems;
  }
  
  const industryItems = (industryConfig.industryItems[industry as keyof typeof industryConfig.industryItems] || []) as ConversationItem[];
  
  return [...generalItems, ...industryItems];
}

/**
 * Get only industry-specific items (excludes general items)
 */
export function getIndustrySpecificItems(industry: string): ConversationItem[] {
  if (!industry || industry === 'Other') {
    return [];
  }
  
  return (industryConfig.industryItems[industry as keyof typeof industryConfig.industryItems] || []) as ConversationItem[];
}

/**
 * Get only general items (available to all industries)
 */
export function getGeneralItems(): ConversationItem[] {
  return industryConfig.generalItems as ConversationItem[];
}

/**
 * Check if an industry has specific items
 */
export function hasIndustrySpecificItems(industry: string): boolean {
  const items = getIndustrySpecificItems(industry);
  return items.length > 0;
}

