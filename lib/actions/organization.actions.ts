"use server";

import { revalidatePath } from "next/cache";
import { connectToDB } from "@/lib/mongoose";
import Organization from "@/lib/models/organization.model";
import User from "@/lib/models/user.model";
import mongoose from "mongoose";

interface CreateOrganizationParams {
  id: string;
  name: string;
  bio: string;
  logo: string;
  userId: string;
}

export async function createOrganization({
  id,
  name,
  bio,
  logo,
  userId,
}: CreateOrganizationParams) {
  try {
    await connectToDB();

    // Verify database connection
    console.log("MongoDB Connection Status:", mongoose.connection.readyState);
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

    // Find the user who is creating the organization
    const user = await User.findOne({ id: userId });

    if (!user) {
      throw new Error("User not found");
    }

    console.log("Found user:", user.id, user._id);

    // Check if organization with the same name or ID already exists
    const existingOrganization = await Organization.findOne({
      $or: [{ id }, { name }],
    });

    if (existingOrganization) {
      throw new Error(
        "Organization with the same ID or name already exists"
      );
    }

    // Create a new organization document
    const organizationData = {
      id,
      name,
      bio,
      logo,
      createdBy: user._id,
      members: [user._id], // Add creator as first member
    };

    console.log("Creating organization with data:", organizationData);

    // Create a new organization using the model constructor
    const newOrganization = new Organization(organizationData);

    // Save the organization to the database with explicit await and error handling
    let savedOrganization;
    try {
      savedOrganization = await newOrganization.save();
      console.log("Organization saved successfully:", savedOrganization._id);
    } catch (saveError) {
      console.error("Error saving organization:", saveError);
      throw new Error(`Database save error: ${saveError.message}`);
    }
    
    if (!savedOrganization) {
      throw new Error("Failed to save organization to database");
    }

    // Update the user's organizations array
    try {
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $push: { organizations: savedOrganization._id } },
        { new: true }
      );
      console.log("Updated user organizations:", updatedUser.organizations);
    } catch (updateError) {
      console.error("Error updating user with organization:", updateError);
      // Don't throw here, we'll keep the organization but log the error
    }

    // Revalidate the paths to update the UI
    revalidatePath("/organizations");
    revalidatePath(`/organizations/${id}`);
    revalidatePath(`/profile/${userId}`);

    return savedOrganization;
  } catch (error: any) {
    // Detailed error logging for debugging
    console.error("Error creating organization:", error);
    throw new Error(`Failed to create organization: ${error.message}`);
  }
}

export async function fetchOrganizations({
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
}) {
  try {
    await connectToDB();

    // Calculate the number of organizations to skip
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the search string
    const regex = new RegExp(searchString, "i");

    // Create the query object
    const query = {
      name: { $regex: regex },
    };

    // Sort options
    const sortOptions = { createdAt: sortBy };

    // Find organizations that match the query, with pagination
    const organizationsQuery = Organization.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)
      .populate("members");

    // Count the total number of organizations that match the query
    const totalOrganizationsCount = await Organization.countDocuments(query);

    const organizations = await organizationsQuery.exec();

    // Check if there are more organizations beyond the current page
    const isNext = totalOrganizationsCount > skipAmount + organizations.length;

    return { organizations, isNext };
  } catch (error: any) {
    console.error("Error fetching organizations:", error);
    throw new Error(`Failed to fetch organizations: ${error.message}`);
  }
}

export async function fetchOrganizationDetails(id: string) {
  try {
    await connectToDB();

    const organizationDetails = await Organization.findOne({ id })
      .populate("members")
      .populate("createdBy");

    if (!organizationDetails) {
      throw new Error("Organization not found");
    }

    return organizationDetails;
  } catch (error: any) {
    console.error("Error fetching organization details:", error);
    throw new Error(`Failed to fetch organization details: ${error.message}`);
  }
}

export async function addMemberToOrganization(
  organizationId: string,
  memberId: string
) {
  try {
    await connectToDB();

    // Find the organization by ID
    const organization = await Organization.findOne({ id: organizationId });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Find the user by ID
    const user = await User.findOne({ id: memberId });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if the user is already a member of the organization
    const isAlreadyMember = organization.members.some(
      (member: mongoose.Types.ObjectId) => member.equals(user._id)
    );

    if (isAlreadyMember) {
      throw new Error("User is already a member of the organization");
    }

    // Add the user to the organization's members
    organization.members.push(user._id);
    await organization.save();

    // Add the organization to the user's organizations
    user.organizations.push(organization._id);
    await user.save();

    // Revalidate the paths to update the UI
    revalidatePath(`/organizations/${organizationId}`);
    revalidatePath(`/profile/${memberId}`);

    return organization;
  } catch (error: any) {
    console.error("Error adding member to organization:", error);
    throw new Error(`Failed to add member to organization: ${error.message}`);
  }
}

export async function removeUserFromOrganization(
  userId: string,
  organizationId: string
) {
  try {
    await connectToDB();

    const userIdObject = await User.findOne({ id: userId }, { _id: 1 });
    if (!userIdObject) {
      throw new Error("User not found");
    }

    const organization = await Organization.findOne({ id: organizationId });
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Check if user is the creator of the organization
    if (organization.createdBy.toString() === userIdObject._id.toString()) {
      throw new Error("Organization creator cannot be removed");
    }

    // Update the organization by removing the user from members
    await Organization.updateOne(
      { id: organizationId },
      { $pull: { members: userIdObject._id } }
    );

    // Update the user by removing the organization
    await User.updateOne(
      { id: userId },
      { $pull: { organizations: organization._id } }
    );

    revalidatePath(`/organizations/${organizationId}`);
    revalidatePath(`/profile/${userId}`);
  } catch (error: any) {
    console.error("Error removing user from organization:", error);
    throw new Error(`Failed to remove user from organization: ${error.message}`);
  }
}

export async function updateOrganizationInfo({
  organizationId,
  name,
  bio,
  logo,
}: {
  organizationId: string;
  name: string;
  bio: string;
  logo: string;
}) {
  try {
    await connectToDB();

    // Find the organization by ID
    const organization = await Organization.findOne({ id: organizationId });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Update the organization information
    organization.name = name;
    organization.bio = bio;
    organization.logo = logo;

    // Save the updated organization
    await organization.save();

    revalidatePath(`/organizations/${organizationId}`);

    return organization;
  } catch (error: any) {
    console.error("Error updating organization:", error);
    throw new Error(`Failed to update organization: ${error.message}`);
  }
}

export async function deleteOrganization(organizationId: string) {
  try {
    await connectToDB();

    // Find the organization
    const organization = await Organization.findOne({ id: organizationId });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Remove the organization from all users' organizations arrays
    await User.updateMany(
      { organizations: organization._id },
      { $pull: { organizations: organization._id } }
    );

    // Delete the organization
    await Organization.findByIdAndDelete(organization._id);

    revalidatePath("/organizations");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting organization:", error);
    throw new Error(`Failed to delete organization: ${error.message}`);
  }
}
