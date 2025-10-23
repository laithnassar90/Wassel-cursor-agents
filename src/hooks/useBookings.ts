import { useAuth } from '../contexts/AuthContext';
import { useBookings } from '../hooks/useBookings';

export default function BookingsPage() {
  const { user } = useAuth();

  // ✅ Always call hooks unconditionally
  const { bookings, loading, error } = useBookings();

  // You can still guard UI rendering safely
  if (!user) {
    return <div>Please log in</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {bookings.map((b) => (
        <div key={b.id}>{b.status}</div>
      ))}
    </div>
  );
}
