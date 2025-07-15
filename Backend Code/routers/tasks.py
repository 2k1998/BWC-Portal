from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from database import get_db
from models import Task, User, Group
from schemas import TaskCreate, TaskResponse, TaskUpdate
from .auth import get_current_user
from .utils import check_roles
from .dependencies import get_task_for_update  # --- NEW: Import the dependency ---

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # This endpoint remains the same
    check_roles(current_user, ["admin"])
    new_task = Task(**task.dict(), owner_id=current_user.id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/", response_model=list[TaskResponse])
def list_my_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # This endpoint remains the same
    if current_user.role == "admin":
        return db.query(Task).all()
    else:
        # A more efficient query to get personal tasks and tasks from all groups the user is in
        user_group_ids = [group.id for group in current_user.groups]
        return db.query(Task).filter(
            (Task.owner_id == current_user.id) |
            (Task.group_id.in_(user_group_ids))
        ).all()

@router.get("/{task_id}", response_model=TaskResponse)
def read_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # This endpoint remains the same
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    is_owner = task.owner_id == current_user.id
    is_admin = current_user.role == "admin"
    is_member = False
    if task.group_id:
        group = db.query(Group).filter(Group.id == task.group_id).first()
        if group and current_user in group.members:
            is_member = True

    if not (is_admin or is_owner or is_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this task.")
    
    return task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_update: TaskUpdate,
    task: Task = Depends(get_task_for_update), # <-- Use the new dependency
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # <-- Still need this for the final check
):
    """
    Updates a task after verifying permissions with the get_task_for_update dependency.
    """
    update_data = task_update.dict(exclude_unset=True)

    # If the user is neither admin nor owner, they must be a group member.
    # The dependency already confirmed this. Now, check which fields they are trying to update.
    if current_user.role != "admin" and task.owner_id != current_user.id:
        allowed_fields_for_member = {"status", "completed"}
        if not set(update_data.keys()).issubset(allowed_fields_for_member):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="As a group member, you can only update the task's status or completion."
            )

    # Apply the updates
    for field, value in update_data.items():
        setattr(task, field, value)

    # Handle the logic where status and completed are linked
    if "completed" in update_data:
        task.status = "completed" if task.completed else "new"
    elif "status" in update_data:
        task.completed = task.status == "completed"

    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # This endpoint remains the same
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not (current_user.role == "admin" or task.owner_id == current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this task.")

    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)