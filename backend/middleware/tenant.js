import asyncHandler from "express-async-handler";

// Reads the active company from the "x-company-id" header (sent by the
// frontend company switcher), verifies the logged-in user is a member of
// that company, and attaches req.companyId + req.companyRole for use in
// every downstream controller/query.
export const resolveTenant = asyncHandler(async (req, res, next) => {
  const companyId = req.headers["x-company-id"];

  if (!companyId) {
    res.status(400);
    throw new Error("Missing x-company-id header. Select a company first.");
  }

  const membership = req.user.memberships.find(
    (m) => m.company.toString() === companyId
  );

  if (!membership) {
    res.status(403);
    throw new Error("You do not have access to this company");
  }

  req.companyId = companyId;
  req.companyRole = membership.role;
  next();
});

// Restrict route to specific roles within the active company
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.companyRole)) {
    res.status(403);
    throw new Error("You do not have permission to perform this action");
  }
  next();
};
