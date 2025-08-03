import React from 'react';
import OrderNotification from './OrderNotification';

const NotificationManager = ({ notifications, onCloseNotification }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div key={notification.id} style={{ transform: `translateY(${index * 5}px)` }}>
          <OrderNotification
            orderId={notification.orderId}
            sourceToken={notification.sourceToken}
            destinationToken={notification.destinationToken}
            sourceAmount={notification.sourceAmount}
            destinationAmount={notification.destinationAmount}
            direction={notification.direction}
            status={notification.status}
            onClose={() => onCloseNotification(notification.id)}
            duration={notification.duration}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationManager; 