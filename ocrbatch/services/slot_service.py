class SlotService:
    def __init__(self, max_slots, max_users):
        self.total_slots = 8
        self.max_users = 3
        self.user_slots = {}

    def check_free_slots(self):
        """Check and return the number of free slots."""
        used_slots = sum(self.user_slots.values())
        return self.total_slots - used_slots

    def can_allocate_slots(self, user_id, requested_slots):
        """
        Check if the requested slots can be allocated to the user.
        Conditions:
        - Each user can use up to 2 slots.
        - Total slots do not exceed the system limit.
        - No more than max_users concurrently.
        """
        current_user_slots = self.user_slots.get(user_id, 0)
        if current_user_slots + requested_slots > 2:
            return False  # Single user cannot exceed 2 slots
        if self.check_free_slots() < requested_slots:
            return False  # Not enough free slots available
        if user_id not in self.user_slots and len(self.user_slots) >= self.max_users:
            return False  # Max concurrent users reached
        return True

    def allocate_slots(self, user_id, requested_slots):
        """Allocate slots to a user if possible."""
        if not self.can_allocate_slots(user_id, requested_slots):
            return False, "Cannot allocate slots. Check user or system limits."

        if user_id not in self.user_slots:
            self.user_slots[user_id] = 0

        self.user_slots[user_id] += requested_slots
        return True, f"Allocated {requested_slots} slots to user {user_id}."

    def release_slots(self, user_id):
        """Release all slots allocated to a specific user."""
        if user_id in self.user_slots:
            del self.user_slots[user_id]
            return True, f"Released slots for user {user_id}."
        return False, "User not found."
