import { Injectable, NotFoundException } from '@nestjs/common';
import { Platform } from './schemas/platform.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateFlatFormDto } from './dto/create/create-platform.dto';

@Injectable()
export class PlatformsService {
  constructor(
    @InjectModel(Platform.name) private platformsModel: Model<Platform>,
  ) {}

  /**
   * Creates a new platform based on the provided DTO.
   *
   * @param {CreateFlatFormDto} createPlatFormDto - The data transfer object containing the platform details.
   * @returns {Promise<Platform>} - The created platform document.
   * @throws {Error} - If a platform with the same name already exists.
   */
  async create(createPlatFormDto: CreateFlatFormDto): Promise<Platform> {
    const { url, apikey, name } = createPlatFormDto;
    const findPlatform = await this.platformsModel.findOne({ name });
    if (findPlatform) {
      throw new Error('Platform already exists');
    }

    const createdPlatform = new this.platformsModel({
      url,
      apikey,
      name,
    });
    return createdPlatform.save();
  }

  /**
   * Get all platform based on the provided DTO.
   *
   * @returns {Promise<Platform[]>} - Return platform document.
   */
  async getAll(): Promise<Platform[]> {
    return await this.platformsModel.find().exec();
  }

  /**
   * Retrieves a platform by its ID.
   *
   * @param {string} id - The ID of the platform to retrieve.
   * @returns {Promise<Platform>} - The found platform document.
   * @throws  - If no platform is found with the given ID.
   */
  async getById(id: string): Promise<Platform> {
    const platform = await this.platformsModel.findById(id);
    if (!platform) {
      throw new Error(`Platform with ID ${id} not found`);
    }
    return platform;
  }

  /**
   * Updates a platform by its ID.
   *
   * @param {string} id - The ID of the platform to update.
   * @param {CreateFlatFormDto} updatePlatFormDto - The data to update the platform with.
   * @returns {Promise<Platform>} - The updated platform document.
   * @throws  - If no platform is found with the given ID.
   */
  async update(
    id: string,
    updatePlatFormDto: CreateFlatFormDto,
  ): Promise<Platform> {
    if (!id || !updatePlatFormDto)
      throw new Error('id and updatedPlatform is require');
    const updatedPlatform = await this.platformsModel.findByIdAndUpdate(
      id,
      updatePlatFormDto,
      { new: true },
    );
    if (!updatedPlatform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }
    return updatedPlatform;
  }

  /**
   * Deletes a platform by its ID.
   *
   * @param {string} id - The ID of the platform to delete.
   * @returns {Promise<{ deleted: boolean }>} - An object indicating whether the platform was deleted.
   * @throws  - If no platform is found with the given ID.
   */
  async delete(id: string): Promise<{ deleted: boolean }> {
    if (!id) throw new Error('id is require');
    const result = await this.platformsModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error(`Platform with ID ${id} not found`);
    }
    return { deleted: true };
  }
}
