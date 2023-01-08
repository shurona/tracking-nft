export interface OpenseaEventType {
  event_type: string;
  payload: {
    base_price?: string;
    sale_price?: string;
    collection: { slug: string };
    event_timestamp: string;
    expiration_date: string;
    is_private: boolean;
    item: {
      chain: {
        name: string;
      };
      metadata: {
        animation_url: string;
        image_url: string;
        metadat_url: string;
        name: string;
      };
      nft_id: string;
      permalink: string;
    };
    listing_date: string;
    listing_type: string;
    maker: { address: string };
    order_hash: string;
    payment_token: {
      address: string;
      decimals: number;
      eth_price: string;
      name: string;
      symbol: string;
      usd_price: string;
    };
    quantity: number;
    taker: string;
  };
  transaction?: {
    hash: string;
    timestamp: string;
  };
  sent_at: string;
}

export interface EventInfoType {
  price: number;
  ethPrice: number;
  usdPrice: number;
  currencyName: string;
  currencyToken: string;
  decimals: number;
  chainInfo: string;
  contractAddress: string;
  collectionName: string;
  tokenId: string;
  expirationDate: string;
}

export interface OpenseaCollectionStats {
  one_hour_volume: number;
  one_hour_change: number;
  one_hour_sales: number;
  one_hour_sales_change: number;
  one_hour_average_price: number;
  one_hour_difference: number;
  six_hour_volume: number;
  six_hour_change: number;
  six_hour_sales: number;
  six_hour_sales_change: number;
  six_hour_average_price: number;
  six_hour_difference: number;
  one_day_volume: number;
  one_day_change: number;
  one_day_sales: number;
  one_day_sales_change: number;
  one_day_average_price: number;
  one_day_difference: number;
  seven_day_volume: number;
  seven_day_change: number;
  seven_day_sales: number;
  seven_day_average_price: number;
  seven_day_difference: number;
  thirty_day_volume: number;
  thirty_day_change: number;
  thirty_day_sales: number;
  thirty_day_average_price: number;
  thirty_day_difference: number;
  total_volume: number;
  total_sales: number;
  total_supply: number;
  count: number;
  num_owners: number;
  average_price: number;
  num_reports: number;
  market_cap: number;
  floor_price: number;
}
