// JOBWORKERS Saved Search Routes
// API endpoints for saved search CRUD operations

import { Context } from 'hono';
import { SavedSearchRepository } from '../repositories/SavedSearchRepository';
import { CreateSavedSearchInput, UpdateSavedSearchInput } from '../types/savedSearch';

const MAX_SAVED_SEARCHES_PER_USER = 20;
const MAX_NAME_LENGTH = 100;
const MAX_SEARCH_LENGTH = 200;
const MAX_FILTER_LENGTH = 100;

// Create saved search
export async function handleCreateSavedSearch(c: Context) {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const body = await c.req.json();

    // Validate name
    if (!body.name || typeof body.name !== 'string') {
      return c.json({ error: 'name is required' }, 400);
    }

    const name = body.name.trim();
    if (name.length === 0) {
      return c.json({ error: 'name cannot be empty' }, 400);
    }

    if (name.length > MAX_NAME_LENGTH) {
      return c.json({ error: `name cannot exceed ${MAX_NAME_LENGTH} characters` }, 400);
    }

    // Validate search length
    if (body.search && typeof body.search === 'string' && body.search.length > MAX_SEARCH_LENGTH) {
      return c.json({ error: `search cannot exceed ${MAX_SEARCH_LENGTH} characters` }, 400);
    }

    // Validate filter lengths
    const filters = ['source', 'location', 'employment_type', 'category'];
    for (const filter of filters) {
      if (body[filter] && typeof body[filter] === 'string' && body[filter].length > MAX_FILTER_LENGTH) {
        return c.json({ error: `${filter} cannot exceed ${MAX_FILTER_LENGTH} characters` }, 400);
      }
    }

    // Check saved search limit
    const repo = new SavedSearchRepository(c.env.DB);
    const count = await repo.countSavedSearchesByUser(user.id);
    if (count >= MAX_SAVED_SEARCHES_PER_USER) {
      return c.json({ 
        error: `Maximum ${MAX_SAVED_SEARCHES_PER_USER} saved searches per user` 
      }, 400);
    }

    const input: CreateSavedSearchInput = {
      user_id: user.id,
      name,
      search: (typeof body.search === 'string' && body.search.length > 0) ? body.search : undefined,
      source: (typeof body.source === 'string' && body.source.length > 0) ? body.source : undefined,
      location: (typeof body.location === 'string' && body.location.length > 0) ? body.location : undefined,
      employment_type: (typeof body.employment_type === 'string' && body.employment_type.length > 0) ? body.employment_type : undefined,
      category: (typeof body.category === 'string' && body.category.length > 0) ? body.category : undefined,
      remote: body.remote === true,
      is_active: body.is_active !== false,
    };

    const savedSearch = await repo.createSavedSearch(input);
    return c.json(savedSearch, 201);
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'A saved search with this name already exists' }, 400);
    }
    console.error('Create saved search error:', error);
    return c.json({ error: 'Failed to create saved search' }, 500);
  }
}

// List saved searches
export async function handleListSavedSearches(c: Context) {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const repo = new SavedSearchRepository(c.env.DB);
    const searches = await repo.listSavedSearchesByUser(user.id);
    return c.json({ data: searches });
  } catch (error) {
    console.error('List saved searches error:', error);
    return c.json({ error: 'Failed to list saved searches' }, 500);
  }
}

// Get saved search detail
export async function handleGetSavedSearch(c: Context) {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ error: 'Invalid ID' }, 400);
    }
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400);
    }

    const repo = new SavedSearchRepository(c.env.DB);
    const search = await repo.getSavedSearchById(id);

    if (!search) {
      return c.json({ error: 'Saved search not found' }, 404);
    }

    // Ownership check
    if (search.user_id !== user.id) {
      return c.json({ error: 'Saved search not found' }, 404);
    }

    return c.json(search);
  } catch (error) {
    console.error('Get saved search error:', error);
    return c.json({ error: 'Failed to get saved search' }, 500);
  }
}

// Update saved search
export async function handleUpdateSavedSearch(c: Context) {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ error: 'Invalid ID' }, 400);
    }
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400);
    }

    const repo = new SavedSearchRepository(c.env.DB);
    const existing = await repo.getSavedSearchById(id);

    if (!existing) {
      return c.json({ error: 'Saved search not found' }, 404);
    }

    // Ownership check
    if (existing.user_id !== user.id) {
      return c.json({ error: 'Saved search not found' }, 404);
    }

    const body = await c.req.json();

    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return c.json({ error: 'name cannot be empty' }, 400);
      }
      if (body.name.length > MAX_NAME_LENGTH) {
        return c.json({ error: `name cannot exceed ${MAX_NAME_LENGTH} characters` }, 400);
      }
    }

    // Validate lengths
    if (body.search && typeof body.search === 'string' && body.search.length > MAX_SEARCH_LENGTH) {
      return c.json({ error: `search cannot exceed ${MAX_SEARCH_LENGTH} characters` }, 400);
    }

    const filters = ['source', 'location', 'employment_type', 'category'];
    for (const filter of filters) {
      if (body[filter] && typeof body[filter] === 'string' && body[filter].length > MAX_FILTER_LENGTH) {
        return c.json({ error: `${filter} cannot exceed ${MAX_FILTER_LENGTH} characters` }, 400);
      }
    }

    const input: UpdateSavedSearchInput = {};
    if (body.name !== undefined) input.name = body.name.trim();
    if (body.search !== undefined) input.search = (typeof body.search === 'string' && body.search.length > 0) ? body.search : null;
    if (body.source !== undefined) input.source = (typeof body.source === 'string' && body.source.length > 0) ? body.source : null;
    if (body.location !== undefined) input.location = (typeof body.location === 'string' && body.location.length > 0) ? body.location : null;
    if (body.employment_type !== undefined) input.employment_type = (typeof body.employment_type === 'string' && body.employment_type.length > 0) ? body.employment_type : null;
    if (body.category !== undefined) input.category = (typeof body.category === 'string' && body.category.length > 0) ? body.category : null;
    if (body.remote !== undefined) input.remote = body.remote === true;
    if (body.is_active !== undefined) input.is_active = body.is_active === true;

    const updated = await repo.updateSavedSearch(id, input);
    return c.json(updated);
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'A saved search with this name already exists' }, 400);
    }
    console.error('Update saved search error:', error);
    return c.json({ error: 'Failed to update saved search' }, 500);
  }
}

// Delete saved search
export async function handleDeleteSavedSearch(c: Context) {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ error: 'Invalid ID' }, 400);
    }
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400);
    }

    const repo = new SavedSearchRepository(c.env.DB);
    const existing = await repo.getSavedSearchById(id);

    if (!existing) {
      return c.json({ error: 'Saved search not found' }, 404);
    }

    // Ownership check
    if (existing.user_id !== user.id) {
      return c.json({ error: 'Saved search not found' }, 404);
    }

    await repo.deleteSavedSearch(id);
    return c.body(null, 204);
  } catch (error) {
    console.error('Delete saved search error:', error);
    return c.json({ error: 'Failed to delete saved search' }, 500);
  }
}

// List job alerts
export async function handleListJobAlerts(c: Context) {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const unreadParam = c.req.query('unread');
    const unreadOnly = unreadParam === 'true';

    const repo = new SavedSearchRepository(c.env.DB);
    const alerts = await repo.getJobAlertsByUser(user.id, unreadOnly);
    
    return c.json({ data: alerts });
  } catch (error) {
    console.error('List job alerts error:', error);
    return c.json({ error: 'Failed to list job alerts' }, 500);
  }
}

// Mark alert as read
export async function handleMarkAlertRead(c: Context) {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const idParam = c.req.param('id');
    if (!idParam) {
      return c.json({ error: 'Invalid ID' }, 400);
    }
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400);
    }

    const repo = new SavedSearchRepository(c.env.DB);
    const alert = await repo.getJobAlertById(id);

    if (!alert) {
      return c.json({ error: 'Alert not found' }, 404);
    }

    // Verify ownership via saved_search
    const search = await repo.getSavedSearchById(alert.saved_search_id);
    if (!search || search.user_id !== user.id) {
      return c.json({ error: 'Alert not found' }, 404);
    }

    const body = await c.req.json();
    if (body.read === true) {
      await repo.markAlertAsRead(id);
    }

    const updated = await repo.getJobAlertById(id);
    return c.json(updated);
  } catch (error) {
    console.error('Mark alert read error:', error);
    return c.json({ error: 'Failed to mark alert as read' }, 500);
  }
}
