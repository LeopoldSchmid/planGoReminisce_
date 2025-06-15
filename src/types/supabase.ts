export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      trips: {
        Row: {
          id: string
          name: string
          description: string | null
          start_date: string | null
          end_date: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      trip_invitations: {
        Row: {
          id: string
          trip_id: string
          email: string | null
          token: string
          expires_at: string
          used_at: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          email?: string | null
          token: string
          expires_at: string
          used_at?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          email?: string | null
          token?: string
          expires_at?: string
          used_at?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_invitations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          }
        ]
      }
      trip_members: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      shopping_lists: {
        Row: {
          id: string
          trip_id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          }
        ]
      }
      shopping_list_items: {
        Row: {
          id: string
          list_id: string
          name: string
          quantity: number | null
          unit: string | null
          notes: string | null
          category: string | null
          added_by: string
          assigned_to: string | null
          is_purchased: boolean
          purchased_by: string | null
          purchased_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          name: string
          quantity?: number | null
          unit?: string | null
          notes?: string | null
          category?: string | null
          added_by: string
          assigned_to?: string | null
          is_purchased?: boolean
          purchased_by?: string | null
          purchased_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          name?: string
          quantity?: number | null
          unit?: string | null
          notes?: string | null
          category?: string | null
          added_by?: string
          assigned_to?: string | null
          is_purchased?: boolean
          purchased_by?: string | null
          purchased_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      expenses: {
        Row: {
          id: string
          trip_id: string
          name: string
          description: string | null
          total_amount: number
          currency: string
          category: string | null
          paid_by: string
          split_method: string
          receipt_url: string | null
          expense_date: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          name: string
          description?: string | null
          total_amount: number
          currency?: string
          category?: string | null
          paid_by: string
          split_method?: string
          receipt_url?: string | null
          expense_date?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          name?: string
          description?: string | null
          total_amount?: number
          currency?: string
          category?: string | null
          paid_by?: string
          split_method?: string
          receipt_url?: string | null
          expense_date?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      expense_participants: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          amount_owed: number
          is_settled: boolean
          settled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          amount_owed: number
          is_settled?: boolean
          settled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          expense_id?: string
          user_id?: string
          amount_owed?: number
          is_settled?: boolean
          settled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_participants_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      expense_payments: {
        Row: {
          id: string
          expense_id: string
          from_user: string
          to_user: string
          amount: number
          payment_method: string | null
          payment_date: string
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          expense_id: string
          from_user: string
          to_user: string
          amount: number
          payment_method?: string | null
          payment_date?: string
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          expense_id?: string
          from_user?: string
          to_user?: string
          amount?: number
          payment_method?: string | null
          payment_date?: string
          notes?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_payments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_payments_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_payments_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      recipes: {
        Row: {
          id: string
          trip_id: string
          name: string
          description: string | null
          servings: number
          prep_time_minutes: number | null
          cook_time_minutes: number | null
          instructions: string[] | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          name: string
          description?: string | null
          servings?: number
          prep_time_minutes?: number | null
          cook_time_minutes?: number | null
          instructions?: string[] | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          name?: string
          description?: string | null
          servings?: number
          prep_time_minutes?: number | null
          cook_time_minutes?: number | null
          instructions?: string[] | null
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          name: string
          quantity: number
          unit: string | null
          notes: string | null
          category: string | null
          optional: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          name: string
          quantity: number
          unit?: string | null
          notes?: string | null
          category?: string | null
          optional?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          name?: string
          quantity?: number
          unit?: string | null
          notes?: string | null
          category?: string | null
          optional?: boolean
          order_index?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          }
        ]
      }
      meal_plans: {
        Row: {
          id: string
          trip_id: string
          recipe_id: string
          planned_date: string
          meal_type: string
          planned_servings: number
          notes: string | null
          assigned_cook: string | null
          is_completed: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          recipe_id: string
          planned_date: string
          meal_type?: string
          planned_servings?: number
          notes?: string | null
          assigned_cook?: string | null
          is_completed?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          recipe_id?: string
          planned_date?: string
          meal_type?: string
          planned_servings?: number
          notes?: string | null
          assigned_cook?: string | null
          is_completed?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_assigned_cook_fkey"
            columns: ["assigned_cook"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_availability: {
        Row: {
          id: string
          user_id: string
          date: string
          availability_status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          availability_status: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          availability_status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      trip_availability_overrides: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          date: string
          availability_status: string
          override_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          date: string
          availability_status: string
          override_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          date?: string
          availability_status?: string
          override_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_availability_overrides_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_availability_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      date_proposals: {
        Row: {
          id: string
          trip_id: string
          proposed_by: string
          title: string
          start_date: string
          end_date: string
          notes: string | null
          is_finalized: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          proposed_by: string
          title: string
          start_date: string
          end_date: string
          notes?: string | null
          is_finalized?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          proposed_by?: string
          title?: string
          start_date?: string
          end_date?: string
          notes?: string | null
          is_finalized?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_proposals_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_proposals_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      destination_proposals: {
        Row: {
          id: string
          trip_id: string
          date_proposal_id: string | null
          proposed_by: string
          destination_name: string
          destination_description: string | null
          destination_notes: string | null
          is_finalized: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          date_proposal_id?: string | null
          proposed_by: string
          destination_name: string
          destination_description?: string | null
          destination_notes?: string | null
          is_finalized?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          date_proposal_id?: string | null
          proposed_by?: string
          destination_name?: string
          destination_description?: string | null
          destination_notes?: string | null
          is_finalized?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "destination_proposals_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destination_proposals_date_proposal_id_fkey"
            columns: ["date_proposal_id"]
            isOneToOne: false
            referencedRelation: "date_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destination_proposals_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      proposal_discussions: {
        Row: {
          id: string
          trip_id: string
          date_proposal_id: string | null
          destination_proposal_id: string | null
          parent_comment_id: string | null
          user_id: string
          comment_text: string
          is_edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          date_proposal_id?: string | null
          destination_proposal_id?: string | null
          parent_comment_id?: string | null
          user_id: string
          comment_text: string
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          date_proposal_id?: string | null
          destination_proposal_id?: string | null
          parent_comment_id?: string | null
          user_id?: string
          comment_text?: string
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_discussions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_discussions_date_proposal_id_fkey"
            columns: ["date_proposal_id"]
            isOneToOne: false
            referencedRelation: "date_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_discussions_destination_proposal_id_fkey"
            columns: ["destination_proposal_id"]
            isOneToOne: false
            referencedRelation: "destination_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_discussions_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "proposal_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      proposal_votes: {
        Row: {
          id: string
          trip_id: string
          date_proposal_id: string | null
          destination_proposal_id: string | null
          user_id: string
          vote_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          date_proposal_id?: string | null
          destination_proposal_id?: string | null
          user_id: string
          vote_type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          date_proposal_id?: string | null
          destination_proposal_id?: string | null
          user_id?: string
          vote_type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_votes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_votes_date_proposal_id_fkey"
            columns: ["date_proposal_id"]
            isOneToOne: false
            referencedRelation: "date_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_votes_destination_proposal_id_fkey"
            columns: ["destination_proposal_id"]
            isOneToOne: false
            referencedRelation: "destination_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      shopping_list_recipe_items: {
        Row: {
          id: string
          shopping_list_item_id: string
          recipe_id: string
          meal_plan_id: string | null
          scaled_servings: number
          original_quantity: number
          scaled_quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          shopping_list_item_id: string
          recipe_id: string
          meal_plan_id?: string | null
          scaled_servings: number
          original_quantity: number
          scaled_quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          shopping_list_item_id?: string
          recipe_id?: string
          meal_plan_id?: string | null
          scaled_servings?: number
          original_quantity?: number
          scaled_quantity?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_recipe_items_shopping_list_item_id_fkey"
            columns: ["shopping_list_item_id"]
            isOneToOne: true
            referencedRelation: "shopping_list_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_recipe_items_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_id_by_email: {
        Args: {
          email: string
        }
        Returns: string | null
      }
      get_trip_members: {
        Args: {
          trip_id: string
        }
        Returns: {
          user_id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          role: string
          joined_at: string
        }[]
      }
      create_trip_invitation: {
        Args: {
          p_trip_id: string
          p_email?: string
        }
        Returns: {
          invitation_id: string
          token: string
          expires_at: string
        }
      }
      use_trip_invitation: {
        Args: {
          p_token: string
          p_user_id: string
        }
        Returns: {
          success: boolean
          trip_id: string | null
          error_message: string | null
        }
      }
      get_effective_availability: {
        Args: {
          p_trip_id: string
          p_user_id: string
          p_date: string
        }
        Returns: string
      }
      get_trip_availability_heatmap: {
        Args: {
          p_trip_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          date: string
          total_members: number
          available_count: number
          unavailable_count: number
          availability_percentage: number
        }[]
      }
      get_proposal_stats: {
        Args: {
          p_date_proposal_id?: string
          p_destination_proposal_id?: string
        }
        Returns: {
          upvotes: number
          downvotes: number
          neutral_votes: number
          total_votes: number
          net_score: number
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}