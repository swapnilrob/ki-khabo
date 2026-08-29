const wrapper = (content) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="font-size: 28px; font-weight: 700; color: #E8913A;">🍴 Ki Khabo</span>
  </div>
  ${content}
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="font-size: 12px; color: #999; text-align: center;">
    This is an automated email from Ki Khabo. Do not reply to this email.
  </p>
</div>
`;

export const orderPlacedEmail = (userName, orderType, restaurantName, totalAmount) => ({
  subject: "Your " + orderType + " has been placed - Ki Khabo",
  html: wrapper(`
    <h2 style="color: #1A1A1A;">Hi ${userName},</h2>
    <p>Your <strong>${orderType}</strong> at <strong>${restaurantName}</strong> has been placed successfully.</p>
    ${totalAmount ? '<p style="font-size: 18px; font-weight: 700; color: #E8913A;">Total: ৳' + totalAmount + "</p>" : ""}
    <p>The restaurant will review your ${orderType} shortly. You'll be notified when they respond.</p>
  `),
});

export const orderStatusEmail = (userName, orderType, restaurantName, status, reason) => ({
  subject: "Your " + orderType + " has been " + status + " - Ki Khabo",
  html: wrapper(`
    <h2 style="color: #1A1A1A;">Hi ${userName},</h2>
    <p>Your <strong>${orderType}</strong> at <strong>${restaurantName}</strong> has been
    <strong style="color: ${status === "approved" || status === "completed" ? "#1E7D34" : status === "rejected" ? "#C0392B" : "#2563eb"};">
      ${status}
    </strong>.</p>
    ${reason ? '<p style="color: #666;">Reason: ' + reason + "</p>" : ""}
  `),
});

export const newOrderForOwnerEmail = (ownerName, orderType, userName, totalAmount) => ({
  subject: "New " + orderType + " received - Ki Khabo",
  html: wrapper(`
    <h2 style="color: #1A1A1A;">Hi ${ownerName},</h2>
    <p>You have a new <strong>${orderType}</strong> from <strong>${userName}</strong>.</p>
    ${totalAmount ? '<p style="font-size: 18px; font-weight: 700; color: #E8913A;">Total: ৳' + totalAmount + "</p>" : ""}
    <p>Please review it in your owner dashboard.</p>
  `),
});

export const applicationReceivedEmail = (ownerName, businessName) => ({
  subject: "Application received - Ki Khabo",
  html: wrapper(`
    <h2 style="color: #1A1A1A;">Hi ${ownerName},</h2>
    <p>Your restaurant <strong>${businessName}</strong> has been submitted for verification.</p>
    <p>An admin will review your application shortly. You'll receive another email when a decision is made.</p>
  `),
});

export const applicationDecisionEmail = (ownerName, businessName, status, reason) => ({
  subject: "Restaurant " + status + " - Ki Khabo",
  html: wrapper(`
    <h2 style="color: #1A1A1A;">Hi ${ownerName},</h2>
    <p>Your restaurant <strong>${businessName}</strong> has been
    <strong style="color: ${status === "approved" ? "#1E7D34" : "#C0392B"};">${status}</strong>.</p>
    ${status === "approved" ? "<p>Your restaurant is now live and visible to users. You can start adding menu items.</p>" : ""}
    ${reason ? '<p style="color: #666;">Reason: ' + reason + "</p>" : ""}
  `),
});

export const subscriptionEmail = (userName, action, planName) => ({
  subject: "Subscription " + action + " - Ki Khabo",
  html: wrapper(`
    <h2 style="color: #1A1A1A;">Hi ${userName},</h2>
    <p>Your <strong>${planName || "Premium"}</strong> subscription has been
    <strong style="color: ${action === "activated" ? "#1E7D34" : "#C0392B"};">${action}</strong>.</p>
    ${action === "activated" ? "<p>You now have access to the AI Nutrition Assistant, AI Food Image Recognition, and loyalty discounts.</p>" : "<p>Your premium features have been deactivated. You can resubscribe anytime.</p>"}
  `),
});

export const mealPlanReminderEmail = (userName, dayName, meals) => ({
  subject: "Today's meal plan - Ki Khabo",
  html: wrapper(`
    <h2 style="color: #1A1A1A;">Good morning, ${userName}!</h2>
    <p>Here are your planned meals for <strong>${dayName}</strong>:</p>
    <div style="background: #FDF3E7; border-radius: 8px; padding: 16px; margin: 12px 0;">
      ${meals.length > 0 ? meals.map((m) => '<p style="margin: 4px 0;">🍽️ <strong>' + m.slot + ":</strong> " + m.name + "</p>").join("") : '<p style="color: #999;">No meals planned for today.</p>'}
    </div>
    <p>Have a healthy day!</p>
  `),
});