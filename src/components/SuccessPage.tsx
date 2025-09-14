import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowLeft, Receipt, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface SuccessPageProps {
  onBack: () => void;
}

interface OrderData {
  order_id: number;
  checkout_session_id: string;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestOrder = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('stripe_orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching order:', error);
        } else {
          setOrderData(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestOrder();
  }, [user]);

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency.toUpperCase() === 'AUD' ? 'A$' : currency.toUpperCase() === 'USD' ? '$' : currency;
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600">
              Thank you for your purchase. Your premium job posting is now active.
            </p>
          </div>

          {loading ? (
            <div className="mb-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : orderData ? (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Receipt className="h-4 w-4 mr-2" />
                  Order Details
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formatAmount(orderData.amount_total, orderData.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize text-green-600">{orderData.payment_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formatDate(orderData.created_at)}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center text-blue-700 mb-2">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="font-medium">What's Next?</span>
            </div>
            <p className="text-sm text-blue-600">
              Your premium job posting will be featured for 30 days with enhanced visibility and priority placement.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onBack}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Continue to Dashboard
            </button>
            
            <button
              onClick={onBack}
              className="flex items-center justify-center w-full text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};