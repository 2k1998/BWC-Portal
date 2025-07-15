from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Task, Group
from .auth import get_current_user

def get_task_for_update(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Task:
    """
    Fetches a task by its ID and verifies if the current user has permission to update it.
    Raises HTTPException if the task is not found or the user is not authorized.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    is_owner = task.owner_id == current_user.id
    is_admin = current_user.role == "admin"
    
    # Admins and owners have full update access
    if is_admin or is_owner:
        return task

    # Check if the user is a member of the task's group
    if task.group_id:
        group = db.query(Group).filter(Group.id == task.group_id).first()
        if group and current_user in group.members:
            # Grant access for group members, but the route handler will check which fields they can update
            return task
            
    # If none of the above conditions are met, deny access
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not authorized to update this task."
    )