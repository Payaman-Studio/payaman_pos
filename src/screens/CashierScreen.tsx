import { useResponsive } from '../hooks/useResponsive';
import CashierPhoneLayout from './cashier/CashierPhoneLayout';
import CashierTabletLayout from './cashier/CashierTabletLayout';

function CashierScreen() {
  const { isTablet } = useResponsive();

  if (isTablet) {
    return <CashierTabletLayout />;
  }

  return <CashierPhoneLayout />;
}

export default CashierScreen;
