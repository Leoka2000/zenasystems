<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Accelerometer extends Model
{
     use HasFactory;

    protected $fillable = ['x', 'y', 'z', 'timestamp'];
}
