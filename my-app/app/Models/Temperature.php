<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Temperature extends Model
{
    protected $fillable = ['temperature', 'timestamp'];
}
