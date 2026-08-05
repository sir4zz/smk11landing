<?php

namespace App\Services;

use App\Models\MadingPost;
use App\Models\MadingReview;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;

class MadingService
{
    public function __construct(protected PermissionService $permissions)
    {
    }

    /**
     * Replica of guard_mading_post_insert.
     */
    public function guardInsert(User $user, array $data): array
    {
        $role = $user->profileRecord?->role;
        $status = $data['status'] ?? 'draft';

        if (! $role) {
            throw ValidationException::withMessages(['message' => 'Unauthorized']);
        }

        if ($role === 'student') {
            if (($data['author_id'] ?? null) !== $user->id) {
                throw ValidationException::withMessages(['message' => 'Tidak dapat membuat karya atas nama orang lain']);
            }
            if ($status === 'published') {
                throw ValidationException::withMessages(['message' => 'Siswa tidak dapat publish langsung']);
            }
            if (! in_array($status, ['draft', 'pending_review'], true)) {
                $status = 'draft';
            }
        } else {
            if ($status === 'published' && ! $this->permissions->hasPermission($user, 'mading.publish')) {
                throw ValidationException::withMessages(['message' => 'Tidak memiliki izin publish']);
            }
        }

        $data['status'] = $status;

        if ($status === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        return $data;
    }

    /**
     * Replica of guard_mading_post_update.
     */
    public function guardUpdate(User $user, MadingPost $post, array $data): array
    {
        $role = $user->profileRecord?->role;
        $oldStatus = $post->status;
        $newStatus = $data['status'] ?? $oldStatus;

        if (! $role) {
            throw ValidationException::withMessages(['message' => 'Unauthorized']);
        }

        if ($role === 'student') {
            if (($data['author_id'] ?? $post->author_id) !== $post->author_id) {
                throw ValidationException::withMessages(['message' => 'Tidak dapat mengubah pemilik karya']);
            }
            if (! in_array($oldStatus, ['draft', 'rejected'], true)) {
                throw ValidationException::withMessages(['message' => 'Karya sudah dalam review atau terbit']);
            }
            if (in_array($newStatus, ['published', 'approved'], true)) {
                throw ValidationException::withMessages(['message' => 'Siswa tidak dapat publish']);
            }
            if (! in_array($newStatus, ['draft', 'pending_review', 'rejected'], true)) {
                $newStatus = 'draft';
            }
        } else {
            $newAuthorId = $data['author_id'] ?? $post->author_id;
            if ($newAuthorId !== $post->author_id && ! $this->permissions->hasPermission($user, 'mading.edit_all')) {
                throw ValidationException::withMessages(['message' => 'Tidak dapat mengubah pemilik karya']);
            }
            if ($newStatus === 'published' && ! $this->permissions->hasPermission($user, 'mading.publish')) {
                throw ValidationException::withMessages(['message' => 'Tidak memiliki izin publish']);
            }
        }

        $data['status'] = $newStatus;

        if ($newStatus === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }
        if ($newStatus !== 'published') {
            $data['published_at'] = null;
        }

        return $data;
    }

    /**
     * Replica of submit_mading_post(p_post_id).
     */
    public function submit(User $user, string $postId): void
    {
        $role = $user->profileRecord?->role;

        if (! $role) {
            throw ValidationException::withMessages(['message' => 'Unauthorized']);
        }

        $canSubmitForSelf = $this->permissions->hasPermission($user, 'mading.submit_review');

        $affected = MadingPost::query()
            ->where('id', $postId)
            ->when($canSubmitForSelf === false, function ($q) use ($user) {
                $q->where('author_id', $user->id);
            })
            ->where(function ($q) use ($user, $canSubmitForSelf) {
                $q->where('author_id', $user->id);
                if ($canSubmitForSelf) {
                    $q->orWhereRaw('1 = 1');
                }
            })
            ->update([
                'status' => 'pending_review',
                'updated_at' => now(),
            ]);

        if ($affected === 0) {
            throw ValidationException::withMessages(['message' => 'Karya tidak ditemukan atau tidak diizinkan']);
        }
    }

    /**
     * Replica of review_mading_post(p_post_id, p_action, p_feedback).
     */
    public function review(User $user, string $postId, string $action, string $feedback = ''): void
    {
        if (! $this->permissions->hasPermission($user, 'mading.review')) {
            throw ValidationException::withMessages(['message' => 'Tidak memiliki izin review']);
        }

        $nextStatus = $action === 'approve' ? 'approved' : 'rejected';

        $post = MadingPost::findOrFail($postId);

        $post->update([
            'status' => $nextStatus,
            'feedback' => $action === 'reject' ? $feedback : '',
            'updated_at' => now(),
        ]);

        MadingReview::create([
            'post_id' => $post->id,
            'reviewer_id' => $user->id,
            'reviewer_name' => $user->profileRecord?->name ?? $user->name ?? '',
            'action' => $action,
            'feedback' => $feedback,
            'created_at' => now(),
        ]);
    }

    /**
     * Replica of publish_mading_post(p_post_id).
     */
    public function publish(User $user, string $postId): void
    {
        if (! $this->permissions->hasPermission($user, 'mading.publish')) {
            throw ValidationException::withMessages(['message' => 'Tidak memiliki izin publish']);
        }

        $post = MadingPost::findOrFail($postId);

        $post->update([
            'status' => 'published',
            'published_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Visibility rules for the post list (replica of RLS):
     * published OR author = self OR staff with mading.view.
     */
    public function canView(User $user, MadingPost $post): bool
    {
        return $post->status === 'published'
            || $post->author_id === $user->id
            || $this->permissions->hasPermission($user, 'mading.view');
    }
}
